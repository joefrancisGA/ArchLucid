namespace ArchLucid.Contracts.ArchitectureIntelligence;

public enum PublicNetworkAccessVerificationOutcome
{
    Unverified = 0,
    Verified = 1,
    Contradicted = 2,
}

/// <summary>Verification of the explicit Azure setting at the observed snapshot time.</summary>
public sealed record PublicNetworkAccessVerification(
    Guid CloudResourceId,
    PublicNetworkAccessVerificationOutcome Outcome,
    Guid? SnapshotId = null,
    DateTime? CapturedUtc = null);
