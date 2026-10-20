namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed class ReachabilityPathEnumerationResult
{
    public required IReadOnlyList<ReachabilityPathCandidate> Candidates
    {
        get;
        init;
    }

    public required IReadOnlyList<SecurityEvidencePathSearchLimitHit> LimitHits
    {
        get;
        init;
    }
}
