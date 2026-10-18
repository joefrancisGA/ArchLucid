namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed class PrivilegePathEnumerationResult
{
    public required IReadOnlyList<PrivilegePathCandidate> Candidates
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
