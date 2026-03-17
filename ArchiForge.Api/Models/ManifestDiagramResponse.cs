namespace ArchiForge.Api.Models;

public sealed class ManifestDiagramResponse
{
    public string ManifestVersion { get; set; } = string.Empty;

    public string DiagramType { get; set; } = "Mermaid";

    public string Content { get; set; } = string.Empty;
}

