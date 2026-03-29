namespace ArchiForge.Api.Models;

public sealed class ReplayExportMetadataResponse
{
    public string ExportRecordId { get; set; } = string.Empty;

    public string RunId { get; set; } = string.Empty;

    public string ExportType { get; set; } = string.Empty;

    public string Format { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public string? TemplateProfile { get; set; }

    public string? TemplateProfileDisplayName { get; set; }

    public bool WasAutoSelected { get; set; }

    public string? ResolutionReason { get; set; }
}

