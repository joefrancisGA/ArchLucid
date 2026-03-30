namespace ArchiForge.Api.Models;

public sealed class ManifestSummaryResponse
{
    public string ManifestVersion { get; set; } = string.Empty;
    public string Format { get; set; } = "markdown";

    /// <summary>
    /// Markdown content (preferred field).
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Back-compat field for older clients (same as <see cref="Content"/>).
    /// </summary>
    public string Summary { get; set; } = string.Empty;
}
