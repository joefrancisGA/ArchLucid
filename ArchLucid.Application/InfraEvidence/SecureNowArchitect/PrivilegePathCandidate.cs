namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class PrivilegePathCandidate
{
    public IReadOnlyList<PrivilegePathEdge> Hops
    {
        get;
        init;
    } = [];

    public string TerminalScopeNodeId
    {
        get;
        init;
    } = string.Empty;

    public string? EffectiveRoleName
    {
        get;
        init;
    }

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

    public bool IsFederatedDeploymentPath
    {
        get;
        init;
    }
}
