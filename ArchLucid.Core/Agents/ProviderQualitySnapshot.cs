namespace ArchLucid.Core.Agents;

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
