namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class CapabilityToFlowCandidate
{
    public IReadOnlyList<PrivilegePathEdge> Hops
    {
        get;
        init;
    } = [];

    public string WorkloadIdentityNodeId
    {
        get;
        init;
    } = string.Empty;

    public string DataAssetNodeId
    {
        get;
        init;
    } = string.Empty;

    public bool HasInsufficientEvidenceHop
    {
        get;
        init;
    }

    public bool HasUnrestrictedEgressHop
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

    public string? EffectiveRoleName
    {
        get;
        init;
    }
}
