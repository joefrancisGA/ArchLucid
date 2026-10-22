using System.Text;
using System.Text.Json;
using ArchLucid.Contracts.ArchitectureIntelligence;
using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArchitectureIntelligence;

public sealed partial class DapperArchitectureIntelligencePersistence
{
    public async Task SaveSourceAsync(
        ImmutableSourceArtifact artifact,
        byte[] content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(artifact);
        ArgumentNullException.ThrowIfNull(content);
        cancellationToken.ThrowIfCancellationRequested();

        string contentSha256 = ComputeSha256Hex(content);
        Guid tenantId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(artifact.TenantId);
        int version = int.TryParse(artifact.Version, out int parsedVersion) ? parsedVersion : 1;
        Dictionary<string, string> metadata = new(artifact.Metadata)
        {
            ["originalTenantId"] = artifact.TenantId,
        };
        string metadataJson = JsonSerializer.Serialize(metadata, JsonOptions);

        string? blobUri = null;
        byte[]? inlineContent = content;

        if (content.Length > InlineContentThresholdBytes && _blobStore is not null)
        {
            string blobName = $"{artifact.ArtifactId}/{contentSha256}";
            string textContent = Encoding.UTF8.GetString(content);
            blobUri = await _blobStore.WriteAsync(BlobContainerName, blobName, textContent, cancellationToken);
            inlineContent = null;
        }

        const string sql = """
            MERGE dbo.ArchitectureIntelligenceSources AS target
            USING (SELECT @ArtifactId AS ArtifactId) AS source
            ON target.ArtifactId = source.ArtifactId
            WHEN MATCHED THEN
                UPDATE SET
                    TenantId = @TenantId,
                    ContentSha256 = @ContentSha256,
                    ContentType = @ContentType,
                    FileName = @FileName,
                    OwnershipClass = @OwnershipClass,
                    Version = @Version,
                    BlobUri = @BlobUri,
                    ContentVarBinary = @ContentVarBinary,
                    MetadataJson = @MetadataJson
            WHEN NOT MATCHED THEN
                INSERT
                (
                    ArtifactId, TenantId, ContentSha256, ContentType, FileName,
                    OwnershipClass, Version, BlobUri, ContentVarBinary, MetadataJson, CreatedUtc
                )
                VALUES
                (
                    @ArtifactId, @TenantId, @ContentSha256, @ContentType, @FileName,
                    @OwnershipClass, @Version, @BlobUri, @ContentVarBinary, @MetadataJson, @CreatedUtc
                );
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                artifact.ArtifactId,
                TenantId = tenantId,
                ContentSha256 = contentSha256,
                artifact.ContentType,
                artifact.FileName,
                OwnershipClass = (byte)artifact.OwnershipClass,
                Version = version,
                BlobUri = blobUri ?? artifact.BlobUri,
                ContentVarBinary = inlineContent,
                MetadataJson = metadataJson,
                CreatedUtc = artifact.CreatedUtc == default
                    ? TimeProvider.System.GetUtcNow().UtcDateTime
                    : artifact.CreatedUtc,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceAsync(
        string tenantId,
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        (ImmutableSourceArtifact Artifact, byte[] Content)? stored =
            await GetSourceByArtifactIdAsync(artifactId, cancellationToken);

        if (stored is null)
        {
            return null;
        }

        if (!string.Equals(stored.Value.Artifact.TenantId, tenantId, StringComparison.Ordinal))
        {
            return null;
        }

        return stored;
    }

    public async Task<(ImmutableSourceArtifact Artifact, byte[] Content)?> GetSourceByArtifactIdAsync(
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        const string sql = """
            SELECT
                ArtifactId,
                TenantId,
                ContentSha256,
                ContentType,
                FileName,
                OwnershipClass,
                Version,
                BlobUri,
                ContentVarBinary,
                MetadataJson,
                CreatedUtc
            FROM dbo.ArchitectureIntelligenceSources
            WHERE ArtifactId = @ArtifactId;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        SourceRow? row = await connection.QueryFirstOrDefaultAsync<SourceRow>(
            new CommandDefinition(sql, new { ArtifactId = artifactId }, cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        byte[] content = await ResolveContentAsync(row, cancellationToken);
        ImmutableSourceArtifact artifact = MapSourceRow(row);

        return (artifact, content);
    }

    private async Task<byte[]> ResolveContentAsync(SourceRow row, CancellationToken cancellationToken)
    {
        if (row.ContentVarBinary is { Length: > 0 })
        {
            return row.ContentVarBinary;
        }

        if (!string.IsNullOrWhiteSpace(row.BlobUri) && _blobStore is not null)
        {
            string? blobContent = await _blobStore.ReadAsync(row.BlobUri, cancellationToken);

            if (!string.IsNullOrEmpty(blobContent))
            {
                return Encoding.UTF8.GetBytes(blobContent);
            }
        }

        return [];
    }

    private static ImmutableSourceArtifact MapSourceRow(SourceRow row)
    {
        Dictionary<string, string> metadata = [];

        if (!string.IsNullOrWhiteSpace(row.MetadataJson))
        {
            metadata = JsonSerializer.Deserialize<Dictionary<string, string>>(row.MetadataJson, JsonOptions)
                ?? new Dictionary<string, string>();
        }

        return new ImmutableSourceArtifact
        {
            ArtifactId = row.ArtifactId,
            TenantId = metadata.TryGetValue("originalTenantId", out string? originalTenantId)
                && !string.IsNullOrWhiteSpace(originalTenantId)
                ? originalTenantId
                : row.TenantId.ToString(),
            ContentSha256 = row.ContentSha256,
            ContentType = row.ContentType,
            FileName = row.FileName,
            OwnershipClass = (ArtifactOwnershipClass)row.OwnershipClass,
            Version = row.Version.ToString(),
            BlobUri = row.BlobUri,
            CreatedUtc = row.CreatedUtc,
            Metadata = metadata,
        };
    }

    private sealed class SourceRow
    {
        public string ArtifactId
        {
            get;
            init;
        } = null!;

        public Guid TenantId
        {
            get;
            init;
        }

        public string ContentSha256
        {
            get;
            init;
        } = null!;

        public string ContentType
        {
            get;
            init;
        } = null!;

        public string? FileName
        {
            get;
            init;
        }

        public byte OwnershipClass
        {
            get;
            init;
        }

        public int Version
        {
            get;
            init;
        }

        public string? BlobUri
        {
            get;
            init;
        }

        public byte[]? ContentVarBinary
        {
            get;
            init;
        }

        public string MetadataJson
        {
            get;
            init;
        } = "{}";

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
