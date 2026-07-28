using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligencePersistence
{
    Task SaveSourceAsync(ImmutableSourceArtifact artifact, byte[] content, CancellationToken cancellationToken = default);

    Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceAsync(
        string tenantId,
        string artifactId,
        CancellationToken cancellationToken = default);

    Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceByArtifactIdAsync(
        string artifactId,
        CancellationToken cancellationToken = default);

    Task SaveModelAsync(ArchitectureKnowledgeModel model, CancellationToken cancellationToken = default);

    Task<ArchitectureKnowledgeModel?> GetModelAsync(
        string tenantId,
        string modelId,
        CancellationToken cancellationToken = default);
}
