namespace ArchiForge.Contracts.Metadata;

public sealed class ComparisonRecord
{
    public string ComparisonRecordId { get; set; } = Guid.NewGuid().ToString("N");

    public string ComparisonType { get; set; } = string.Empty;

    public string? LeftRunId
    {
        get; set;
    }

    public string? RightRunId
    {
        get; set;
    }

    public string? LeftManifestVersion
    {
        get; set;
    }

    public string? RightManifestVersion
    {
        get; set;
    }

    public string? LeftExportRecordId
    {
        get; set;
    }

    public string? RightExportRecordId
    {
        get; set;
    }

    public string Format { get; set; } = "json";

    public string? SummaryMarkdown
    {
        get; set;
    }

    public string PayloadJson { get; set; } = string.Empty;

    public string? Notes
    {
        get; set;
    }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Optional short label (e.g. release-1.2, incident-42).</summary>
    public string? Label
    {
        get; set;
    }

    /// <summary>Optional tags for filtering and grouping.</summary>
    public List<string> Tags { get; set; } = [];
}

