namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>Redaction-safe training-data export batch from accepted manifests.</summary>
public sealed class FineTuningTrainingExportResult
{
    public Guid ExportBatchId
    {
        get;
        set;
    } = Guid.NewGuid();

    public int ManifestCount
    {
        get;
        set;
    }

    public IReadOnlyList<FineTuningTrainingRecord> Records
    {
        get;
        set;
    } = [];

    public string BundleContentHash
    {
        get;
        set;
    } = string.Empty;

    public FineTuningConsentStatus ConsentSnapshot
    {
        get;
        set;
    }
}
