namespace ArchLucid.Core.Agents;

public interface IProviderQualityMonitor
{
    Task<ProviderQualityAdmission> AdmitAsync(string? providerId, string? modelId, CancellationToken cancellationToken);

    Task<ProviderQualityRecordResult> RecordAsync(ProviderQualityAdjudication sample, CancellationToken cancellationToken);

    Task<bool> SetOperatorOverrideAsync(
        ProviderQualityKey key,
        TimeSpan? duration,
        Guid auditEventId,
        CancellationToken cancellationToken);

    Task BindRecoveryTraceAsync(ProviderQualityKey key, Guid leaseId, string traceId, CancellationToken cancellationToken);
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

public enum ProviderQualityLabel
{
    Unknown = 0,
    Supported = 1,
    Unsupported = 2,
    Contradicted = 3,
}

public sealed record ProviderQualityRecordResult(
    ProviderQualitySnapshot Snapshot,
    bool StateChanged,
    string? Transition);

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
    string? LastReason,
    int DecisionWindowKnownSamples = 0,
    double DecisionWindowWeightedBadRate = 0,
    double DecisionWindowWilsonLowerBound = 0);

public sealed record ProviderQualityAdmission(
    bool Allowed,
    bool RecoveryProbe,
    ProviderQualityKey? Key,
    DateTimeOffset? RetryAfterUtc,
    string? Reason,
    Guid? RecoveryLeaseId = null);
