using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ArtifactSynthesis.Packaging;
using ArchiForge.Core.Scoping;

namespace ArchiForge.Persistence.Queries;

/// <summary>
/// Same behavior as <see cref="DapperArtifactQueryService"/>; type name reflects typical registration in storage-off mode.
/// </summary>
public sealed class InMemoryArtifactQueryService(IArtifactBundleRepository artifactBundleRepository)
    : IArtifactQueryService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactsByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct)
    {
        var artifacts = await GetArtifactsByManifestIdAsync(scope, manifestId, ct);

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
        ScopeContext scope,
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct)
    {
        var artifacts = await GetArtifactsByManifestIdAsync(scope, manifestId, ct);
        return artifacts.FirstOrDefault(x => x.ArtifactId == artifactId);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<SynthesizedArtifact>> GetArtifactsByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct)
    {
        var bundle = await artifactBundleRepository.GetByManifestIdAsync(scope, manifestId, ct);
        return bundle?.Artifacts ?? [];
    }
}
