using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class InMemoryImmutableSourceStore : IImmutableSourceStore
{
    private readonly ConcurrentDictionary<string, StoredArtifact> _artifacts = new(StringComparer.Ordinal);

    public ImmutableSourceArtifact Store(ImmutableSourceArtifact artifact, byte[] content)
    {
        ArgumentNullException.ThrowIfNull(artifact);
        ArgumentNullException.ThrowIfNull(content);

        if (string.IsNullOrWhiteSpace(artifact.ArtifactId))
        {
            throw new ArgumentException("ArtifactId is required.", nameof(artifact));
        }

        if (string.IsNullOrWhiteSpace(artifact.TenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(artifact));
        }

        string contentSha256 = ComputeSha256Hex(content);
        ImmutableSourceArtifact stored = CloneArtifact(artifact, contentSha256);
        _artifacts[stored.ArtifactId] = new StoredArtifact(stored, content);

        return stored;
    }

    public ImmutableSourceArtifact? GetById(string artifactId)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        return _artifacts.TryGetValue(artifactId, out StoredArtifact? stored)
            ? CloneArtifact(stored.Artifact, stored.Artifact.ContentSha256)
            : null;
    }

    public IReadOnlyList<ImmutableSourceArtifact> ListByTenant(string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return [];
        }

        return _artifacts.Values
            .Where(entry => string.Equals(entry.Artifact.TenantId, tenantId, StringComparison.Ordinal))
            .Select(entry => CloneArtifact(entry.Artifact, entry.Artifact.ContentSha256))
            .OrderBy(artifact => artifact.CreatedUtc)
            .ToList();
    }

    public bool VerifyIntegrity(string artifactId, string? expectedQuote = null)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return false;
        }

        if (!_artifacts.TryGetValue(artifactId, out StoredArtifact? stored))
        {
            return false;
        }

        string actualHash = ComputeSha256Hex(stored.Content);

        if (!string.Equals(actualHash, stored.Artifact.ContentSha256, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(expectedQuote))
        {
            return true;
        }

        string contentText = Encoding.UTF8.GetString(stored.Content);

        return contentText.Contains(expectedQuote, StringComparison.OrdinalIgnoreCase);
    }

    internal byte[]? GetContent(string artifactId)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        return _artifacts.TryGetValue(artifactId, out StoredArtifact? stored)
            ? stored.Content
            : null;
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

    private sealed record StoredArtifact(ImmutableSourceArtifact Artifact, byte[] Content);
}
