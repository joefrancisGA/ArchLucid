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
    DateTimeOffset ObservedUtc);

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
    string? Reason);

public interface IProviderQualityMonitor
{
    ProviderQualityRecordResult Record(ProviderQualityAdjudication adjudication);
    ProviderQualitySnapshot GetSnapshot(ProviderQualityKey key);
    ProviderQualityAdmission Admit(string? providerId, string? modelId);
    void RecordRecoveryProbeFailure(ProviderQualityKey key);
    ProviderQualityRecordResult SetHumanOverride(ProviderQualityKey key, bool allow);
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

    public ProviderQualityRecordResult Record(ProviderQualityAdjudication adjudication)
    {
        ArgumentNullException.ThrowIfNull(adjudication);
        ArgumentException.ThrowIfNullOrWhiteSpace(adjudication.SampleId);
        ArgumentException.ThrowIfNullOrWhiteSpace(adjudication.AdjudicatorKind);

        lock (_sync)
        {
            Entry entry = Resolve(adjudication.Key);
            if (!entry.SampleIds.Add(adjudication.SampleId))
                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), false, null);

            ProviderQualityLabel effective = adjudication.Independent
                ? adjudication.Label
                : ProviderQualityLabel.Unknown;

            if (effective == ProviderQualityLabel.Unknown)
            {
                entry.UnknownSamples++;
                if (entry.RecoveryProbeInFlight)
                {
                    ReopenAfterProbe(entry, "Recovery probe was not independently adjudicated.");
                    return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), true, "reopened");
                }

                return new ProviderQualityRecordResult(Snapshot(adjudication.Key, entry), false, null);
            }

            int weight = Math.Clamp(adjudication.SeverityWeight, 1, 4);
            entry.KnownSamples++;
            entry.TotalWeight += weight;

            if (effective is ProviderQualityLabel.Unsupported or ProviderQualityLabel.Contradicted)
            {
                entry.BadSamples++;
                entry.BadWeight += weight * (effective == ProviderQualityLabel.Contradicted ? 1.5 : 1.0);
            }

            if (entry.RecoveryProbeInFlight)
            {
                if (effective == ProviderQualityLabel.Supported)
                {
                    entry.Quarantined = false;
                    entry.QuarantinedUntilUtc = null;
                    entry.RecoveryProbeInFlight = false;
                    entry.RecoveryProbeStartedUtc = null;
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
                if (key.ProviderId != provider || key.ModelId != model || !entry.Quarantined || entry.HumanOverride)
                    continue;

                selected = entry;
                selectedKey = key;
                break;
            }

            if (selected is null || selectedKey is null)
                return new ProviderQualityAdmission(true, false, null, null, null);

            if (selected.RecoveryProbeInFlight
                && selected.RecoveryProbeStartedUtc is { } started
                && now - started >= TimeSpan.FromSeconds(_options.RecoveryProbeLeaseSeconds))
            {
                selected.RecoveryProbeInFlight = false;
                selected.RecoveryProbeStartedUtc = null;
                selected.QuarantinedUntilUtc = now.AddSeconds(_options.QuarantineSeconds);
                selected.LastReason = "Recovery probe lease expired without independent adjudication.";
            }

            if (selected.QuarantinedUntilUtc is { } until && now < until)
                return new ProviderQualityAdmission(false, false, selectedKey, until, selected.LastReason);

            if (selected.RecoveryProbeInFlight)
                return new ProviderQualityAdmission(false, false, selectedKey, selected.QuarantinedUntilUtc, "Recovery probe already in flight.");

            selected.RecoveryProbeInFlight = true;
            selected.RecoveryProbeStartedUtc = now;
            selected.LastReason = "One bounded recovery probe admitted; independent adjudication is required.";
            return new ProviderQualityAdmission(true, true, selectedKey, null, selected.LastReason);
        }
    }

    public void RecordRecoveryProbeFailure(ProviderQualityKey key)
    {
        ArgumentNullException.ThrowIfNull(key);
        lock (_sync)
        {
            Entry entry = Resolve(key);
            if (entry.RecoveryProbeInFlight)
                ReopenAfterProbe(entry, "Recovery probe failed before independent adjudication.");
        }
    }

    public ProviderQualityRecordResult SetHumanOverride(ProviderQualityKey key, bool allow)
    {
        ArgumentNullException.ThrowIfNull(key);
        lock (_sync)
        {
            Entry entry = Resolve(key);
            bool changed = entry.HumanOverride != allow;
            entry.HumanOverride = allow;
            entry.LastReason = allow
                ? "Human override permits this provider/model/version while quarantine history is retained."
                : "Human override removed; quality quarantine applies again.";
            return new ProviderQualityRecordResult(Snapshot(key, entry), changed, allow ? "override_enabled" : "override_removed");
        }
    }

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
        entry.RecoveryProbeInFlight = false;
        entry.RecoveryProbeStartedUtc = null;
        entry.LastReason = reason;
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

    private static ProviderQualitySnapshot Snapshot(ProviderQualityKey key, Entry entry) =>
        new(
            ProviderQualityKey.Create(key.ProviderId, key.ModelId, key.ModelVersion),
            entry.KnownSamples,
            entry.UnknownSamples,
            entry.BadSamples,
            WeightedBadRate(entry),
            WilsonLowerBound(entry.BadSamples, entry.KnownSamples),
            entry.Quarantined,
            entry.QuarantinedUntilUtc,
            entry.HumanOverride,
            entry.RecoveryProbeInFlight,
            entry.LastReason);

    private sealed class Entry
    {
        internal HashSet<string> SampleIds { get; } = new(StringComparer.Ordinal);
        internal int KnownSamples;
        internal int UnknownSamples;
        internal int BadSamples;
        internal double TotalWeight;
        internal double BadWeight;
        internal bool Quarantined;
        internal DateTimeOffset? QuarantinedUntilUtc;
        internal bool HumanOverride;
        internal bool RecoveryProbeInFlight;
        internal DateTimeOffset? RecoveryProbeStartedUtc;
        internal string? LastReason;
    }
}
