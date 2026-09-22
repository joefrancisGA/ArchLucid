using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class PrivilegePathEdge
{
    public string FromNodeId
    {
        get;
        init;
    } = string.Empty;

    public string ToNodeId
    {
        get;
        init;
    } = string.Empty;

    public string EdgeType
    {
        get;
        init;
    } = string.Empty;

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string? RoleName
    {
        get;
        init;
    }

    public string? InferenceSource
    {
        get;
        init;
    }
}
