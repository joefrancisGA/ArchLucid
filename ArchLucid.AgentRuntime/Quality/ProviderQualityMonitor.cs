using System.Text.Json;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Quality;

/// <summary>Independent adjudication labels; Unknown never counts as a successful sample.</summary>
public enum ProviderQualityLabel
{
    Unknown = 0,
    Supported = 1,
    Unsupported = 2,
    Contradicted = 3,
}

public sealed class ProviderQualityOptions
{
    public const string SectionPath = "ArchLucid:Agents:ProviderQuality";

    // Enable only after the system-catalog migration is deployed and verified.
    public bool UseDurableState { get; set; }

    public bool Enabled { get; set; } = true;
    public bool EnforceQuarantine { get; set; } = true;
    public int MinimumIndependentKnownSamples { get; set; } = 30;
    public double MaximumWeightedBadRate { get; set; } = 0.35;
    public double MinimumWilsonBadRate { get; set; } = 0.20;
    public int QuarantineSeconds { get; set; } = 900;
    public int RecoveryProbeLeaseSeconds { get; set; } = 120;

    public void Normalize()
    {
        MinimumIndependentKnownSamples = Math.Clamp(MinimumIndependentKnownSamples, 5, 10_000);
        MaximumWeightedBadRate = Math.Clamp(MaximumWeightedBadRate, 0.01, 1.0);
        MinimumWilsonBadRate = Math.Clamp(MinimumWilsonBadRate, 0.0, 1.0);
        QuarantineSeconds = Math.Clamp(QuarantineSeconds, 30, 86_400);
        RecoveryProbeLeaseSeconds = Math.Clamp(RecoveryProbeLeaseSeconds, 10, 3_600);
    }
}

public sealed record ProviderQualityKey(string ProviderId, string ModelId, string ModelVersion)
{
    public static ProviderQualityKey Create(string? providerId, string? modelId, string? modelVersion) =>
        new(Normalize(providerId), Normalize(modelId), Normalize(modelVersion));

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim().ToLowerInvariant();
}

public sealed record ProviderQualityAdjudication(
    string SampleId,
    ProviderQualityKey Key,
    ProviderQualityLabel Label,
    int SeverityWeight,
    bool Independent,
    string AdjudicatorKind,
    DateTimeOffset ObservedUtc,
    string? TraceId = null);

public sealed record ProviderQualitySnapshot(
    ProviderQualityKey Key,
    int KnownSampleCount,
    int UnknownSampleCount,
    int BadSampleCount,
    double WeightedBadRate,
    double WilsonBadRateLowerBound,
    bool Quarantined,
    DateTimeOffset? QuarantinedUntilUtc,
    bool HumanOverride,
    bool RecoveryProbeInFlight,
    string? LastReason);

public sealed record ProviderQualityRecordResult(
    ProviderQualitySnapshot Snapshot,
    bool StateChanged,
    string? Transition);

public sealed record ProviderQualityAdmission(
    bool Allowed,
    bool RecoveryProbe,
    ProviderQualityKey? Key,
    DateTimeOffset? RetryAfterUtc,
    string? Reason,
    Guid? RecoveryLeaseId = null);

public interface IProviderQualityMonitor
{
    Task<ProviderQualityAdmission> AdmitAsync(string? providerId, string? modelId, CancellationToken cancellationToken);
    Task<ProviderQualityRecordResult> RecordAsync(ProviderQualityAdjudication sample, CancellationToken cancellationToken);
    Task<bool> SetOperatorOverrideAsync(ProviderQualityKey key, TimeSpan? duration, Guid auditEventId, CancellationToken cancellationToken);
    Task BindRecoveryTraceAsync(ProviderQualityKey key, Guid leaseId, string traceId, CancellationToken cancellationToken);
}

/// <summary>
/// Process-local enforcement cache fed only by independently adjudicated outcomes. Durable trace/audit rows remain the
/// source of history; this state is deliberately rebuilt from new observations after restart.
/// </summary>
public sealed class ProviderQualityMonitor : IProviderQualityMonitor
{
    private readonly ProviderQualityOptions _options;
    private readonly TimeProvider _clock;
    private readonly Lock _sync = new();
    private readonly Dictionary<ProviderQualityKey, Entry> _entries = [];

    public ProviderQualityMonitor(IOptions<ProviderQualityOptions> options, TimeProvider? clock = null)
    {
        _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
        _options.Normalize();
        _clock = clock ?? TimeProvider.System;
    }

    public Task<ProviderQualityAdmission> AdmitAsync(string? providerId, string? modelId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(Admit(providerId, modelId));
    }

    public Task<ProviderQualityRecordResult> RecordAsync(ProviderQualityAdjudication sample, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(Record(sample));
    }

    // Platform overrides require shared state across replicas.
    public Task<bool> SetOperatorOverrideAsync(
        ProviderQualityKey key, TimeSpan? duration, Guid auditEventId, CancellationToken cancellationToken) =>
        Task.FromResult(false);

    public Task BindRecoveryTraceAsync(ProviderQualityKey key, Guid leaseId, string traceId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        BindRecoveryTrace(key, leaseId, traceId);
        return Task.CompletedTask;
    }

    public ProviderQualityRecordResult Record(ProviderQualityAdjudication adjudication)
    {
        ArgumentNullException.ThrowIfNull(adjudication);
        ArgumentException.ThrowIfNullOrWhiteSpace(adjudication.SampleId);
        ArgumentException.ThrowIfNullOrWhiteSpace(adjudication.AdjudicatorKind);

        lock (_sync)
        {
            Entry entry = Resolve(adjudication.Key);
            bool matchesProbe = ProbeIsCurrent(entry)
                && entry.RecoveryTraceId is { } traceId
                && string.Equals(traceId, adjudication.TraceId, StringComparison.Ordinal);
            bool newSample = entry.SampleIds.Add(adjudication.SampleId);
            if (!newSample && !matchesProbe)
                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), false, null);

            ProviderQualityLabel effective = adjudication.Independent
                ? adjudication.Label
                : ProviderQualityLabel.Unknown;

            if (effective == ProviderQualityLabel.Unknown)
            {
                if (newSample)
                    entry.UnknownSamples++;
                if (matchesProbe)
                {
                    ReopenAfterProbe(entry, "Recovery probe was not independently adjudicated.");
                    return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), true, "reopened");
                }

                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), false, null);
            }

            if (newSample)
            {
                int weight = Math.Clamp(adjudication.SeverityWeight, 1, 4);
                entry.KnownSamples++;
                entry.TotalWeight += weight;

                if (effective is ProviderQualityLabel.Unsupported or ProviderQualityLabel.Contradicted)
                {
                    entry.BadSamples++;
                    entry.BadWeight += weight * (effective == ProviderQualityLabel.Contradicted ? 1.5 : 1.0);
                }
            }

            if (matchesProbe)
            {
                if (effective == ProviderQualityLabel.Supported)
                {
                    entry.Quarantined = false;
                    entry.QuarantinedUntilUtc = null;
                    ClearRecoveryProbe(entry);
                    entry.LastReason = "Independent recovery probe was supported.";
                    return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), true, "recovered");
                }

                ReopenAfterProbe(entry, "Independent recovery probe remained unsupported or contradicted.");
                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), true, "reopened");
            }

            double weightedRate = WeightedBadRate(entry);
            double lowerBound = WilsonLowerBound(entry.BadSamples, entry.KnownSamples);
            bool enoughEvidence = entry.KnownSamples >= _options.MinimumIndependentKnownSamples;
            bool suspect = enoughEvidence
                && weightedRate >= _options.MaximumWeightedBadRate
                && lowerBound >= _options.MinimumWilsonBadRate;

            if (_options.Enabled && _options.EnforceQuarantine && suspect && !entry.Quarantined)
            {
                entry.Quarantined = true;
                entry.QuarantinedUntilUtc = _clock.GetUtcNow().AddSeconds(_options.QuarantineSeconds);
                entry.LastReason =
                    $"Independent provider-quality tripwire opened after {entry.KnownSamples} known samples; "
                    + $"weighted bad rate {weightedRate:F3}, Wilson lower bound {lowerBound:F3}.";
                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), true, "quarantined");
            }

            return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), false, null);
        }
    }

    public ProviderQualitySnapshot GetSnapshot(ProviderQualityKey key)
    {
        ArgumentNullException.ThrowIfNull(key);
        lock (_sync)
            return Snapshot(key, Resolve(key));
    }

    public ProviderQualityAdmission Admit(string? providerId, string? modelId)
    {
        string provider = ProviderQualityKey.Create(providerId, modelId, "unknown").ProviderId;
        string model = ProviderQualityKey.Create(providerId, modelId, "unknown").ModelId;

        lock (_sync)
        {
            if (!_options.Enabled || !_options.EnforceQuarantine)
                return new ProviderQualityAdmission(true, false, null, null, null);

            DateTimeOffset now = _clock.GetUtcNow();
            Entry? selected = null;
            ProviderQualityKey? selectedKey = null;

            foreach ((ProviderQualityKey key, Entry entry) in _entries)
            {
                if (key.ProviderId != provider || key.ModelId != model || !entry.Quarantined || HasActiveOverride(entry))
                    continue;

                selected = entry;
                selectedKey = key;
                break;
            }

            if (selected is null || selectedKey is null)
                return new ProviderQualityAdmission(true, false, null, null, null);

            if (selected.RecoveryProbeInFlight && !ProbeIsCurrent(selected))
                ReopenAfterProbe(selected, "Recovery probe lease expired without independent adjudication.");

            if (selected.QuarantinedUntilUtc is { } until && now < until)
                return new ProviderQualityAdmission(false, false, selectedKey, until, selected.LastReason);

            if (selected.RecoveryProbeInFlight)
                return new ProviderQualityAdmission(false, false, selectedKey, selected.QuarantinedUntilUtc, "Recovery probe already in flight.");

            selected.RecoveryProbeInFlight = true;
            selected.RecoveryProbeStartedUtc = now;
            Guid leaseId = Guid.NewGuid();
            selected.RecoveryLeaseId = leaseId;
            selected.LastReason = "One bounded recovery probe admitted; independent adjudication is required.";
            return new ProviderQualityAdmission(true, true, selectedKey, null, selected.LastReason, leaseId);
        }
    }

    internal bool BindRecoveryTrace(ProviderQualityKey key, Guid leaseId, string traceId)
    {
        ArgumentNullException.ThrowIfNull(key);
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        lock (_sync)
        {
            if (!_entries.TryGetValue(key, out Entry? entry) || !ProbeIsCurrent(entry)
                || entry.RecoveryLeaseId != leaseId || entry.RecoveryTraceId is not null)
                return false;

            entry.RecoveryTraceId = traceId;
            return true;
        }
    }

    private bool ProbeIsCurrent(Entry entry) =>
        entry.RecoveryProbeInFlight && entry.RecoveryLeaseId is not null
        && entry.RecoveryProbeStartedUtc is { } started
        && _clock.GetUtcNow() - started < TimeSpan.FromSeconds(_options.RecoveryProbeLeaseSeconds);

    internal bool SetOperatorOverride(ProviderQualityKey key, TimeSpan? duration, Guid auditEventId)
    {
        ArgumentNullException.ThrowIfNull(key);
        if (auditEventId == Guid.Empty || (duration is { } window
            && (window < TimeSpan.FromMinutes(1) || window > TimeSpan.FromHours(1))))
            return false;

        lock (_sync)
        {
            if (!_entries.TryGetValue(key, out Entry? entry) || !entry.Quarantined)
                return false;

            if (duration is { } requested)
            {
                entry.OperatorOverrideUntilUtc = _clock.GetUtcNow() + requested;
                ClearRecoveryProbe(entry);
            }
            else
            {
                entry.OperatorOverrideUntilUtc = null;
            }

            entry.OperatorOverrideAuditEventId = auditEventId;
            return true;
        }
    }

    private bool HasActiveOverride(Entry entry) =>
        entry.OperatorOverrideUntilUtc is { } until && until > _clock.GetUtcNow();

    private Entry Resolve(ProviderQualityKey key)
    {
        ProviderQualityKey normalized = ProviderQualityKey.Create(key.ProviderId, key.ModelId, key.ModelVersion);
        if (_entries.TryGetValue(normalized, out Entry? existing))
            return existing;

        Entry created = new();
        _entries[normalized] = created;
        return created;
    }

    private void ReopenAfterProbe(Entry entry, string reason)
    {
        entry.Quarantined = true;
        entry.QuarantinedUntilUtc = _clock.GetUtcNow().AddSeconds(_options.QuarantineSeconds);
        ClearRecoveryProbe(entry);
        entry.LastReason = reason;
    }

    private static void ClearRecoveryProbe(Entry entry)
    {
        entry.RecoveryProbeInFlight = false;
        entry.RecoveryProbeStartedUtc = null;
        entry.RecoveryLeaseId = null;
        entry.RecoveryTraceId = null;
    }

    private static double WeightedBadRate(Entry entry) =>
        entry.TotalWeight <= 0 ? 0.0 : Math.Clamp(entry.BadWeight / entry.TotalWeight, 0.0, 1.0);

    private static double WilsonLowerBound(int bad, int total)
    {
        if (total <= 0)
            return 0.0;

        const double z = 1.959963984540054;
        double p = (double)bad / total;
        double z2 = z * z;
        double denominator = 1.0 + z2 / total;
        double center = p + z2 / (2.0 * total);
        double margin = z * Math.Sqrt((p * (1.0 - p) + z2 / (4.0 * total)) / total);
        return Math.Max(0.0, (center - margin) / denominator);
    }

    private ProviderQualitySnapshot Snapshot(ProviderQualityKey key, Entry entry) =>
        new(
            ProviderQualityKey.Create(key.ProviderId, key.ModelId, key.ModelVersion),
            entry.KnownSamples,
            entry.UnknownSamples,
            entry.BadSamples,
            WeightedBadRate(entry),
            WilsonLowerBound(entry.BadSamples, entry.KnownSamples),
            entry.Quarantined,
            entry.QuarantinedUntilUtc,
            HasActiveOverride(entry),
            entry.RecoveryProbeInFlight,
            entry.LastReason);

    internal string ExportState() => JsonSerializer.Serialize(_entries.Select(static pair =>
        new PersistedEntry(pair.Key, pair.Value)).ToArray());

    internal void ImportState(string? payload)
    {
        if (payload is null)
            return;

        PersistedEntry[] entries = JsonSerializer.Deserialize<PersistedEntry[]>(payload)
            ?? throw new JsonException("Provider quality state must contain an array.");
        foreach (PersistedEntry row in entries)
            _entries.Add(row.Key, row.State);
    }

    private sealed record PersistedEntry(ProviderQualityKey Key, Entry State);

    private sealed class Entry
    {
        public Entry()
        {
        }

        public HashSet<string> SampleIds { get; set; } = new(StringComparer.Ordinal);
        public int KnownSamples { get; set; }
        public int UnknownSamples { get; set; }
        public int BadSamples { get; set; }
        public double TotalWeight { get; set; }
        public double BadWeight { get; set; }
        public bool Quarantined { get; set; }
        public DateTimeOffset? QuarantinedUntilUtc { get; set; }
        public DateTimeOffset? OperatorOverrideUntilUtc { get; set; }
        public Guid? OperatorOverrideAuditEventId { get; set; }
        public bool RecoveryProbeInFlight { get; set; }
        public DateTimeOffset? RecoveryProbeStartedUtc { get; set; }
        public Guid? RecoveryLeaseId { get; set; }
        public string? RecoveryTraceId { get; set; }
        public string? LastReason { get; set; }
    }
}
