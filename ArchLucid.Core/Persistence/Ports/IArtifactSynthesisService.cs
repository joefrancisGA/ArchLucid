using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Persistence.Ports;

public interface IArtifactSynthesisService
{
    Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        CancellationToken ct);
}
