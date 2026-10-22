namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin request body for Confluence publish.</summary>
public sealed class ConfluenceFirstValueReportPublishRequest
{
    public string RunId { get; set; } = string.Empty;

    /// <summary>Optional absolute API base for deep links inside Markdown (defaults to current request host).</summary>
    public string? ApiBaseForLinks { get; set; }
}
