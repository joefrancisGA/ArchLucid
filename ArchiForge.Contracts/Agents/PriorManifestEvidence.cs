namespace ArchiForge.Contracts.Agents;

public sealed class PriorManifestEvidence
{
    public string ManifestVersion { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public List<string> ExistingServices { get; set; } = [];

    public List<string> ExistingDatastores { get; set; } = [];

    public List<string> ExistingRequiredControls { get; set; } = [];
}
