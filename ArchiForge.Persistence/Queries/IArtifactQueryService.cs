using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ArtifactSynthesis.Packaging;
using ArchiForge.Core.Scoping;

namespace ArchiForge.Persistence.Queries;

/// <summary>
/// Read-only access to synthesized artifacts for a manifest via the artifact bundle repository.
/// </summary>
/// <remarks>
/// SQL: <see cref="DapperArtifactQueryService"/>; in-memory: <see cref="InMemoryArtifactQueryService"/>.
/// Callers: <c>ArchiForge.Api.Controllers.DocxExportController</c>, <c>ArtifactExportController</c>.
/// </remarks>
public interface IArtifactQueryService
{
    /// <summary>Lightweight descriptors sorted by name (no full content load beyond bundle read).</summary>
    Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactsByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct);

    /// <summary>Single artifact body when present in the bundle for <paramref name="manifestId"/>.</summary>
    Task<SynthesizedArtifact?> GetArtifactByIdAsync(
        ScopeContext scope,
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct);

    /// <summary>All artifacts in the bundle for the manifest, or empty when no bundle.</summary>
    Task<IReadOnlyList<SynthesizedArtifact>> GetArtifactsByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct);
}
