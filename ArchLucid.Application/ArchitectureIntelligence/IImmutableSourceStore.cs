using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IImmutableSourceStore
{
    ImmutableSourceArtifact Store(ImmutableSourceArtifact artifact, byte[] content);

    ImmutableSourceArtifact? GetById(string artifactId);

    IReadOnlyList<ImmutableSourceArtifact> ListByTenant(string tenantId);

    bool VerifyIntegrity(string artifactId, string? expectedQuote = null);

    string? TryReadSourceExcerpt(string artifactId, int maxChars = 512);

    Task<ImmutableSourceArtifact> StoreAsync(
        ImmutableSourceArtifact artifact,
        byte[] content,
        CancellationToken cancellationToken = default);

    Task<ImmutableSourceArtifact?> GetByIdAsync(string artifactId, CancellationToken cancellationToken = default);

    Task<bool> VerifyIntegrityAsync(
        string artifactId,
        string? expectedQuote = null,
        CancellationToken cancellationToken = default);

    Task<string?> TryReadSourceExcerptAsync(
        string artifactId,
        int maxChars = 512,
        CancellationToken cancellationToken = default);
}
