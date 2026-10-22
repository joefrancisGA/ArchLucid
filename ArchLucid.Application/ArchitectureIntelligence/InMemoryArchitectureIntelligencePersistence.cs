using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class InMemoryArchitectureIntelligencePersistence : IArchitectureIntelligencePersistence
{
    private readonly ConcurrentDictionary<string, StoredSource> _sources = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, ArchitectureKnowledgeModel> _models = new(StringComparer.Ordinal);

    public Task SaveSourceAsync(ImmutableSourceArtifact artifact, byte[] content, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(artifact);
        ArgumentNullException.ThrowIfNull(content);
        cancellationToken.ThrowIfCancellationRequested();

        string key = BuildSourceKey(artifact.TenantId, artifact.ArtifactId);
        ImmutableSourceArtifact stored = CloneArtifact(artifact, ComputeSha256Hex(content));
        _sources[key] = new StoredSource(stored, content);

        return Task.CompletedTask;
    }

    public Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceAsync(
        string tenantId,
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(artifactId))
        {
            return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(null);
        }

        string key = BuildSourceKey(tenantId, artifactId);

        if (!_sources.TryGetValue(key, out StoredSource? stored))
        {
            return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(null);
        }

        return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(
            (CloneArtifact(stored.Artifact, stored.Artifact.ContentSha256), stored.Content));
    }

    public Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceByArtifactIdAsync(
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(null);
        }

        StoredSource? stored = _sources.Values.FirstOrDefault(
            entry => string.Equals(entry.Artifact.ArtifactId, artifactId, StringComparison.Ordinal));

        if (stored is null)
        {
            return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(null);
        }

        return Task.FromResult<(ImmutableSourceArtifact, byte[])?>(
            (CloneArtifact(stored.Artifact, stored.Artifact.ContentSha256), stored.Content));
    }

    public Task SaveModelAsync(ArchitectureKnowledgeModel model, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(model.ModelId) || string.IsNullOrWhiteSpace(model.TenantId))
        {
            throw new ArgumentException("ModelId and TenantId are required.");
        }

        string key = BuildModelKey(model.TenantId, model.ModelId);
        _models[key] = ArchitectureKnowledgeModelCloner.Clone(model);

        return Task.CompletedTask;
    }

    public Task<ArchitectureKnowledgeModel?> GetModelAsync(
        string tenantId,
        string modelId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(modelId))
        {
            return Task.FromResult<ArchitectureKnowledgeModel?>(null);
        }

        string key = BuildModelKey(tenantId, modelId);

        if (!_models.TryGetValue(key, out ArchitectureKnowledgeModel? model))
        {
            return Task.FromResult<ArchitectureKnowledgeModel?>(null);
        }

        return Task.FromResult<ArchitectureKnowledgeModel?>(ArchitectureKnowledgeModelCloner.Clone(model));
    }

    public Task<ArchitectureKnowledgeModel?> GetModelByRunIdAsync(
        string tenantId,
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(runId))
        {
            return Task.FromResult<ArchitectureKnowledgeModel?>(null);
        }

        ArchitectureKnowledgeModel? latest = _models.Values
            .Where(model => string.Equals(model.TenantId, tenantId, StringComparison.Ordinal)
                && string.Equals(model.RunId, runId, StringComparison.Ordinal))
            .OrderByDescending(model => model.UpdatedUtc)
            .FirstOrDefault();

        return Task.FromResult(latest is null ? null : ArchitectureKnowledgeModelCloner.Clone(latest));
    }

    private static string BuildSourceKey(string tenantId, string artifactId)
    {
        return $"{tenantId}:{artifactId}";
    }

    private static string BuildModelKey(string tenantId, string modelId)
    {
        return $"{tenantId}:{modelId}";
    }

    private static string ComputeSha256Hex(byte[] content)
    {
        byte[] hash = SHA256.HashData(content);

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static ImmutableSourceArtifact CloneArtifact(ImmutableSourceArtifact artifact, string contentSha256)
    {
        return new ImmutableSourceArtifact
        {
            ArtifactId = artifact.ArtifactId,
            TenantId = artifact.TenantId,
            ContentSha256 = contentSha256,
            ContentType = artifact.ContentType,
            FileName = artifact.FileName,
            OwnershipClass = artifact.OwnershipClass,
            CreatedUtc = artifact.CreatedUtc == default
                ? TimeProvider.System.GetUtcNow().UtcDateTime
                : artifact.CreatedUtc,
            Version = artifact.Version,
            BlobUri = artifact.BlobUri,
            Metadata = new Dictionary<string, string>(artifact.Metadata),
        };
    }

    private sealed record StoredSource(ImmutableSourceArtifact Artifact, byte[] Content);
}
