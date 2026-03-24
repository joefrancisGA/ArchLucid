namespace ArchiForge.Api.Models;

public sealed class CreateGovernancePreviewRequest
{
    public string RunId { get; set; } = string.Empty;
    public string ManifestVersion { get; set; } = string.Empty;
    public string Environment { get; set; } = "dev";
}
