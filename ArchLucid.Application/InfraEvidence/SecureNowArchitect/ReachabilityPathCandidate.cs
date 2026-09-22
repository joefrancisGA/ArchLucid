namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class ReachabilityPathCandidate
{
    public IReadOnlyList<PrivilegePathEdge> Hops
    {
        get;
        init;
    } = [];

    public string TerminalAssetNodeId
    {
        get;
        init;
    } = string.Empty;

    public bool HasInsufficientEvidenceHop
    {
        get;
        init;
    }

    public Guid? TerminalCloudResourceId
    {
        get;
        init;
    }

    public string? TerminalResourceType
    {
        get;
        init;
    }

    public bool ScopeTaggedProduction
    {
        get;
        init;
    }
}
