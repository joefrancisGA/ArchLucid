namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Immutable point-in-time audit evidence collection run (references inventory snapshots; does not duplicate ARM JSON).</summary>
public sealed class AuditEvidenceSnapshotHeaderRecord
{
    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public IReadOnlyList<string> SubscriptionIds
    {
        get;
        init;
    } = [];

    public DateTime CollectionStartedUtc
    {
        get;
        init;
    }

    public DateTime CollectionCompletedUtc
    {
        get;
        init;
    }

    public string SelectorVersionsJson
    {
        get;
        init;
    } = "{}";

    public string FrameworkVersion
    {
        get;
        init;
    } = string.Empty;

    public string ControlCatalogVersion
    {
        get;
        init;
    } = string.Empty;

    public decimal Completeness
    {
        get;
        init;
    }

    public IReadOnlyList<string> Failures
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public byte[] EvidenceHashSha256
    {
        get;
        init;
    } = [];

    public IReadOnlyList<Guid> InventorySnapshotIds
    {
        get;
        init;
    } = [];

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
