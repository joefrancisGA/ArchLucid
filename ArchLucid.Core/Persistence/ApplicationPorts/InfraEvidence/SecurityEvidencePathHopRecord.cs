using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathHopRecord
{
    public Guid HopRowId
    {
        get;
        init;
    }

    public Guid PathId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public int HopOrdinal
    {
        get;
        init;
    }

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

    public PathConfidenceBand HopConfidenceBand
    {
        get;
        init;
    }

    public string? InferenceSource
    {
        get;
        init;
    }

    public string EvidenceReference
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }
}
