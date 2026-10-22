namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidencePackageCollectionManifest
{
    public string RootFolder
    {
        get;
        init;
    } = string.Empty;

    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public Guid FrameworkId
    {
        get;
        init;
    }

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

    public string SelectorVersionsJson
    {
        get;
        init;
    } = "{}";

    public IReadOnlyList<Guid> InventorySnapshotIds
    {
        get;
        init;
    } = [];

    public string SnapshotRootHashSha256
    {
        get;
        init;
    } = string.Empty;

    public DateTime ExportedUtc
    {
        get;
        init;
    }
}
