namespace ArchiForge.Contracts.Metadata;

public sealed class RunExportRecord
{
    public string ExportRecordId { get; set; } = Guid.NewGuid().ToString("N");
    public string RunId { get; set; } = string.Empty;
    public string ExportType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string? TemplateProfile
    {
        get; set;
    }
    public string? TemplateProfileDisplayName
    {
        get; set;
    }
    public bool WasAutoSelected
    {
        get; set;
    }
    public string? ResolutionReason
    {
        get; set;
    }
    public string? ManifestVersion
    {
        get; set;
    }
    public string? Notes
    {
        get; set;
    }

    public string? AnalysisRequestJson
    {
        get; set;
    }

    public bool? IncludedEvidence
    {
        get; set;
    }

    public bool? IncludedExecutionTraces
    {
        get; set;
    }

    public bool? IncludedManifest
    {
        get; set;
    }

    public bool? IncludedDiagram
    {
        get; set;
    }

    public bool? IncludedSummary
    {
        get; set;
    }

    public bool? IncludedDeterminismCheck
    {
        get; set;
    }

    public int? DeterminismIterations
    {
        get; set;
    }

    public bool? IncludedManifestCompare
    {
        get; set;
    }

    public string? CompareManifestVersion
    {
        get; set;
    }

    public bool? IncludedAgentResultCompare
    {
        get; set;
    }

    public string? CompareRunId
    {
        get; set;
    }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}

