using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Diagrams;

public interface IManifestDiagramService
{
    string GenerateMermaid(GoldenManifest manifest, ManifestDiagramOptions? options = null);
}

