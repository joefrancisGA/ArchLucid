namespace ArchLucid.Core.Agents;

public sealed record ProviderQualityAdmission(
    bool Allowed,
    bool RecoveryProbe,
    ProviderQualityKey? Key,
    DateTimeOffset? RetryAfterUtc,
    string? Reason,
    Guid? RecoveryLeaseId = null);
