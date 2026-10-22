using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class SqlImmutableSourceStore : IImmutableSourceStore
{
    private readonly IArchitectureIntelligencePersistence _persistence;
    private readonly ConcurrentDictionary<string, string> _artifactTenants = new(StringComparer.Ordinal);

    public SqlImmutableSourceStore(IArchitectureIntelligencePersistence persistence)
    {
        _persistence = persistence ?? throw new ArgumentNullException(nameof(persistence));
    }

    public ImmutableSourceArtifact Store(ImmutableSourceArtifact artifact, byte[] content)
    {
        return StoreAsync(artifact, content).GetAwaiter().GetResult();
    }

    public ImmutableSourceArtifact? GetById(string artifactId)
    {
        return GetByIdAsync(artifactId).GetAwaiter().GetResult();
    }

    public IReadOnlyList<ImmutableSourceArtifact> ListByTenant(string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return [];
        }

        return _artifactTenants
            .Where(pair => string.Equals(pair.Value, tenantId, StringComparison.Ordinal))
            .Select(pair => GetById(pair.Key))
            .Where(artifact => artifact is not null)
            .Cast<ImmutableSourceArtifact>()
            .OrderBy(artifact => artifact.CreatedUtc)
            .ToList();
    }

    public bool VerifyIntegrity(string artifactId, string? expectedQuote = null)
    {
        return VerifyIntegrityAsync(artifactId, expectedQuote).GetAwaiter().GetResult();
    }

    public async Task<ImmutableSourceArtifact> StoreAsync(
        ImmutableSourceArtifact artifact,
        byte[] content,
        CancellationToken cancellationToken = default)
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
        await _persistence.SaveSourceAsync(stored, content, cancellationToken);
        _artifactTenants[stored.ArtifactId] = stored.TenantId;

        return stored;
    }

    public async Task<ImmutableSourceArtifact?> GetByIdAsync(string artifactId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        (ImmutableSourceArtifact Artifact, byte[] Content)? stored =
            await _persistence.GetSourceByArtifactIdAsync(artifactId, cancellationToken);

        if (stored is null)
        {
            return null;
        }

        _artifactTenants[artifactId] = stored.Value.Artifact.TenantId;

        return CloneArtifact(stored.Value.Artifact, stored.Value.Artifact.ContentSha256);
    }

    public async Task<bool> VerifyIntegrityAsync(
        string artifactId,
        string? expectedQuote = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return false;
        }

        (ImmutableSourceArtifact Artifact, byte[] Content)? stored =
            await _persistence.GetSourceByArtifactIdAsync(artifactId, cancellationToken);

        if (stored is null)
        {
            return false;
        }

        string actualHash = ComputeSha256Hex(stored.Value.Content);

        if (!string.Equals(actualHash, stored.Value.Artifact.ContentSha256, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(expectedQuote))
        {
            return true;
        }

        string contentText = Encoding.UTF8.GetString(stored.Value.Content);

        return contentText.Contains(expectedQuote, StringComparison.OrdinalIgnoreCase);
    }

    public string? TryReadSourceExcerpt(string artifactId, int maxChars = 512)
    {
        return TryReadSourceExcerptAsync(artifactId, maxChars).GetAwaiter().GetResult();
    }

    public async Task<string?> TryReadSourceExcerptAsync(
        string artifactId,
        int maxChars = 512,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        (ImmutableSourceArtifact Artifact, byte[] Content)? stored =
            await _persistence.GetSourceByArtifactIdAsync(artifactId, cancellationToken);

        if (stored is null)
        {
            return null;
        }

        string contentText = Encoding.UTF8.GetString(stored.Value.Content);

        return ImmutableSourceExcerptReader.Trim(contentText, maxChars);
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
}
