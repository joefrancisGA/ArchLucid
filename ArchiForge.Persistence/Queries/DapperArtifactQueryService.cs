using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ArtifactSynthesis.Packaging;

namespace ArchiForge.Persistence.Queries;

public sealed class DapperArtifactQueryService : IArtifactQueryService
{
    private readonly IArtifactBundleRepository _artifactBundleRepository;

    public DapperArtifactQueryService(IArtifactBundleRepository artifactBundleRepository)
    {
        _artifactBundleRepository = artifactBundleRepository;
    }

    public async Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactsByManifestIdAsync(
        Guid manifestId,
        CancellationToken ct)
    {
        var artifacts = await GetArtifactsByManifestIdAsync(manifestId, ct);

        return artifacts
            .OrderBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .Select(x => new ArtifactDescriptor
            {
                ArtifactId = x.ArtifactId,
                ArtifactType = x.ArtifactType,
                Name = x.Name,
                Format = x.Format,
                CreatedUtc = x.CreatedUtc,
                ContentHash = x.ContentHash
            })
            .ToList();
    }

    public async Task<SynthesizedArtifact?> GetArtifactByIdAsync(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct)
    {
        var artifacts = await GetArtifactsByManifestIdAsync(manifestId, ct);

        return artifacts.FirstOrDefault(x => x.ArtifactId == artifactId);
    }

    public async Task<IReadOnlyList<SynthesizedArtifact>> GetArtifactsByManifestIdAsync(
        Guid manifestId,
        CancellationToken ct)
    {
        var bundle = await _artifactBundleRepository.GetByManifestIdAsync(manifestId, ct);
        return bundle?.Artifacts ?? [];
    }
}
