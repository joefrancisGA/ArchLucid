using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface IArtifactGenerator
{
    string ArtifactType
    {
        get;
    }

    Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct);
}
