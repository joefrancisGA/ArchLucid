using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathRoutingRecord
{
    public Guid RoutingRowId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid PathId
    {
        get;
        init;
    }

    public Guid? FindingId
    {
        get;
        init;
    }

    public SecurityEvidencePathRoutingRole Role
    {
        get;
        init;
    }

    public string? PrincipalId
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string SourceReference
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
