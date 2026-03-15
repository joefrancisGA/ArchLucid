namespace ArchiForge.Api.Models;

public sealed class ManifestSummaryResponse
{
    public string ManifestVersion { get; set; } = string.Empty;

    public string Format { get; set; } = "markdown";

    public string Summary { get; set; } = string.Empty;
}
