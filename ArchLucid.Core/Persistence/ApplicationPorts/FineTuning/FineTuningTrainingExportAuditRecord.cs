namespace ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;

/// <summary>Audit row for a manifest fine-tuning training-data export batch.</summary>
public sealed class FineTuningTrainingExportAuditRecord
{
    public Guid ExportAuditId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public int ManifestCount
    {
        get;
        set;
    }

    public int RecordCount
    {
        get;
        set;
    }

    public string BundleContentHash
    {
        get;
        set;
    } = string.Empty;

    public string ConsentSnapshot
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    }
}
