using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface IArtifactSynthesisService
{
    Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        CancellationToken ct);
}
