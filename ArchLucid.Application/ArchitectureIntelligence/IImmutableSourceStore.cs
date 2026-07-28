using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IImmutableSourceStore
{
    ImmutableSourceArtifact Store(ImmutableSourceArtifact artifact, byte[] content);

    ImmutableSourceArtifact? GetById(string artifactId);

    IReadOnlyList<ImmutableSourceArtifact> ListByTenant(string tenantId);

    bool VerifyIntegrity(string artifactId, string? expectedQuote = null);
}
