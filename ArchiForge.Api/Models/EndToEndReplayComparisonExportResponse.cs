namespace ArchiForge.Api.Models;

public sealed class EndToEndReplayComparisonExportResponse
{
    public string Format { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string? Content { get; set; }
}

