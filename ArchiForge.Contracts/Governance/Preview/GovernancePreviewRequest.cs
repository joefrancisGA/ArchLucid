namespace ArchiForge.Contracts.Governance.Preview;

public sealed class GovernancePreviewRequest
{
    public string RunId { get; set; } = string.Empty;
    public string ManifestVersion { get; set; } = string.Empty;
    public string Environment { get; set; } = "dev";
}
