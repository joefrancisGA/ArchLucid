using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Models;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlCloudInventoryExtractorPackageRepository(ISqlConnectionFactory connectionFactory)
    : ICloudInventoryExtractorPackageRepository
{
    public async Task InsertAsync(CloudInventoryExtractorPackageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.CloudInventoryExtractorPackages
                           (
                               PackageId, TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc,
                               CloudProvider, SchemaVersion, ScriptVersion, CollectionTimestampUtc,
                               ScopeId, OriginalFileName, ManifestJson, PackageBytes
                           )
                           VALUES
                           (
                               @PackageId, @TenantId, @WorkspaceId, @ProjectId, @RunId, @CreatedUtc,
                               @CloudProvider, @SchemaVersion, @ScriptVersion, @CollectionTimestampUtc,
                               @ScopeId, @OriginalFileName, @ManifestJson, @PackageBytes
                           );
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.PackageId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.RunId,
                    record.CreatedUtc,
                    CloudProvider = (int)record.CloudProvider,
                    record.SchemaVersion,
                    record.ScriptVersion,
                    record.CollectionTimestampUtc,
                    record.ScopeId,
                    record.OriginalFileName,
                    record.ManifestJson,
                    record.PackageBytes,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    public async Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        Guid packageId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT PackageId, RunId, OriginalFileName, PackageBytes
                           FROM dbo.CloudInventoryExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND CloudProvider = @CloudProvider
                               AND PackageId = @PackageId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.QuerySingleOrDefaultAsync<CloudInventoryExtractorPackageDownloadRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    CloudProvider = (int)cloudProvider,
                    PackageId = packageId,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    public async Task<CloudInventoryExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return null;

        const string sql = """
                           SELECT TOP (1)
                               PackageId,
                               CloudProvider,
                               SchemaVersion,
                               ScopeId,
                               CollectionTimestampUtc,
                               CreatedUtc,
                               OriginalFileName
                           FROM dbo.CloudInventoryExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND RunId = @RunId
                               AND CloudProvider = @CloudProvider
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ProvenanceRow? row = await conn.QuerySingleOrDefaultAsync<ProvenanceRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    RunId = runId,
                    CloudProvider = (int)cloudProvider,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return new CloudInventoryExtractorPackageProvenance
        {
            PackageId = row.PackageId,
            CloudProvider = (CloudProvider)row.CloudProvider,
            SchemaVersion = row.SchemaVersion,
            ScopeId = row.ScopeId ?? string.Empty,
            CollectionTimestampUtc = row.CollectionTimestampUtc,
            CreatedUtc = row.CreatedUtc,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
        };
    }

    public async Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            return null;
        }

        const string sql = """
                           SELECT TOP (1) CollectionTimestampUtc
                           FROM dbo.CloudInventoryExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND CloudProvider = @CloudProvider
                               AND CollectionTimestampUtc IS NOT NULL
                           ORDER BY CollectionTimestampUtc DESC, CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DateTime? row = await conn.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    CloudProvider = (int)cloudProvider,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        return DateTime.SpecifyKind(row.Value, DateTimeKind.Utc);
    }

    public async Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            return null;
        }

        const string sql = """
                           SELECT TOP (1) PackageId, RunId, OriginalFileName, PackageBytes
                           FROM dbo.CloudInventoryExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND CloudProvider = @CloudProvider
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DownloadRow? row = await conn.QuerySingleOrDefaultAsync<DownloadRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    CloudProvider = (int)cloudProvider,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (row is null || row.PackageId == Guid.Empty)
        {
            return null;
        }

        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = row.PackageId,
            RunId = row.RunId,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
            PackageBytes = row.PackageBytes ?? [],
        };
    }

    private sealed class DownloadRow
    {
        public Guid PackageId
        {
            get;
            set;
        }

        public Guid? RunId
        {
            get;
            set;
        }

        public string? OriginalFileName
        {
            get;
            set;
        }

        public byte[]? PackageBytes
        {
            get;
            set;
        }
    }

    private sealed class ProvenanceRow
    {
        public Guid PackageId
        {
            get;
            set;
        }

        public int CloudProvider
        {
            get;
            set;
        }

        public int SchemaVersion
        {
            get;
            set;
        }

        public string? ScopeId
        {
            get;
            set;
        }

        public DateTime? CollectionTimestampUtc
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public string? OriginalFileName
        {
            get;
            set;
        }
    }
}
