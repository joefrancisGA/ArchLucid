using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryChangeRecord
{
    public Guid ChangeId
    {
        get;
        init;
    }

    public Guid DiffId
    {
        get;
        init;
    }

    public Guid SnapshotAId
    {
        get;
        init;
    }

    public Guid SnapshotBId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? AzureResourceId
    {
        get;
        init;
    }

    public AzureInventoryChangeType ChangeType
    {
        get;
        init;
    }

    public string? Property
    {
        get;
        init;
    }

    public string? OldValue
    {
        get;
        init;
    }

    public string? NewValue
    {
        get;
        init;
    }

    public string? RiskClassification
    {
        get;
        init;
    }

    public string? ArchitectureSignificance
    {
        get;
        init;
    }

    public string? SecuritySignificance
    {
        get;
        init;
    }

    public decimal? Confidence
    {
        get;
        init;
    }

    public string? EvidenceReference
    {
        get;
        init;
    }

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }
}
