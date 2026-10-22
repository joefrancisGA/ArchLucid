using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlBrandAssetRepository(ISqlConnectionFactory connectionFactory) : IBrandAssetRepository
{
    public async Task InsertAsync(BrandAssetRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.BrandAssets
                           (
                               AssetId, TenantId, AssetType, OriginalFileName, MimeType, Width, Height,
                               StorageReference, ChecksumSha256, Status, CreatedUtc, UpdatedUtc, CreatedBy
                           )
                           VALUES
                           (
                               @AssetId, @TenantId, @AssetType, @OriginalFileName, @MimeType, @Width, @Height,
                               @StorageReference, @ChecksumSha256, @Status, @CreatedUtc, @UpdatedUtc, @CreatedBy
                           );
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.AssetId,
                    record.TenantId,
                    AssetType = (int)record.AssetType,
                    record.OriginalFileName,
                    record.MimeType,
                    record.Width,
                    record.Height,
                    record.StorageReference,
                    record.ChecksumSha256,
                    Status = (int)record.Status,
                    record.CreatedUtc,
                    record.UpdatedUtc,
                    record.CreatedBy,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    public async Task<BrandAssetRecord?> TryGetByIdAsync(Guid tenantId, Guid assetId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                               AssetId, TenantId, AssetType, OriginalFileName, MimeType, Width, Height,
                               StorageReference, ChecksumSha256, Status, CreatedUtc, UpdatedUtc, CreatedBy
                           FROM dbo.BrandAssets
                           WHERE TenantId = @TenantId AND AssetId = @AssetId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssetId = assetId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task UpdateStatusAsync(
        Guid tenantId,
        Guid assetId,
        BrandAssetStatus status,
        DateTime updatedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.BrandAssets
                           SET Status = @Status,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId AND AssetId = @AssetId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AssetId = assetId,
                    Status = (int)status,
                    UpdatedUtc = updatedUtc,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    private static BrandAssetRecord Map(Row row) =>
        new()
        {
            AssetId = row.AssetId,
            TenantId = row.TenantId,
            AssetType = (BrandAssetType)row.AssetType,
            OriginalFileName = row.OriginalFileName,
            MimeType = row.MimeType,
            Width = row.Width,
            Height = row.Height,
            StorageReference = row.StorageReference,
            ChecksumSha256 = row.ChecksumSha256,
            Status = (BrandAssetStatus)row.Status,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            CreatedBy = row.CreatedBy,
        };

    private sealed class Row
    {
        public Guid AssetId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public int AssetType
        {
            get;
            init;
        }

        public string OriginalFileName
        {
            get;
            init;
        } = string.Empty;

        public string MimeType
        {
            get;
            init;
        } = string.Empty;

        public int? Width
        {
            get;
            init;
        }

        public int? Height
        {
            get;
            init;
        }

        public string StorageReference
        {
            get;
            init;
        } = string.Empty;

        public byte[] ChecksumSha256
        {
            get;
            init;
        } = [];

        public int Status
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public string? CreatedBy
        {
            get;
            init;
        }
    }
}
