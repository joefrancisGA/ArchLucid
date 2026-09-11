using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class ToxicCombinationCandidate
{
    public IReadOnlyList<SecurityEvidencePathHopRecord> Hops
    {
        get;
        init;
    } = [];

    public Guid ReachabilityPathId
    {
        get;
        init;
    }

    public Guid PrivilegePathId
    {
        get;
        init;
    }

    public string SharedAssetNodeId
    {
        get;
        init;
    } = string.Empty;

    public string ReachabilityStartNodeId
    {
        get;
        init;
    } = string.Empty;

    public string PrivilegeIdentityNodeId
    {
        get;
        init;
    } = string.Empty;

    public bool HasEgressHop
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

    public bool HasDataPlaneWriteHop
    {
        get;
        init;
    }
}
