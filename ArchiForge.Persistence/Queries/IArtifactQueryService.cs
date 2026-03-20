using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ArtifactSynthesis.Packaging;

namespace ArchiForge.Persistence.Queries;

public interface IArtifactQueryService
{
    Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactsByManifestIdAsync(
        Guid manifestId,
        CancellationToken ct);

    Task<SynthesizedArtifact?> GetArtifactByIdAsync(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct);

    Task<IReadOnlyList<SynthesizedArtifact>> GetArtifactsByManifestIdAsync(
        Guid manifestId,
        CancellationToken ct);
}
