using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IImmutableSourceStore
{
    ImmutableSourceArtifact Store(ImmutableSourceArtifact artifact, byte[] content);

    ImmutableSourceArtifact? GetById(string artifactId);

    IReadOnlyList<ImmutableSourceArtifact> ListByTenant(string tenantId);

    bool VerifyIntegrity(string artifactId, string? expectedQuote = null);

    Task<ImmutableSourceArtifact> StoreAsync(
        ImmutableSourceArtifact artifact,
        byte[] content,
        CancellationToken cancellationToken = default);

    Task<ImmutableSourceArtifact?> GetByIdAsync(string artifactId, CancellationToken cancellationToken = default);

    Task<bool> VerifyIntegrityAsync(
        string artifactId,
        string? expectedQuote = null,
        CancellationToken cancellationToken = default);
}
