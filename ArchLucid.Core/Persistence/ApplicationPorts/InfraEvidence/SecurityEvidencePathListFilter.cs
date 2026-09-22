using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathListFilter
{
    public Guid? SnapshotId
    {
        get;
        init;
    }

    public PathKind? PathKind
    {
        get;
        init;
    }

    public PathConfidenceBand? ConfidenceBand
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }
}
