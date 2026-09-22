namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Ordinal confidence for SecureNow architect paths and hops.
///     Lower numeric value means stronger evidence (Confirmed is strongest).
/// </summary>
public enum PathConfidenceBand
{
    Confirmed = 0,
    HighlyLikely = 1,
    Probable = 2,
    Possible = 3,
    InsufficientEvidence = 4,
}
