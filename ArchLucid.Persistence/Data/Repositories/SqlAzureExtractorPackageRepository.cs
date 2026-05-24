using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Models;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlAzureExtractorPackageRepository(ISqlConnectionFactory connectionFactory)
    : IAzureExtractorPackageRepository
{
    public async Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.AzureExtractorPackages
                           (
                               PackageId, TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc,
                               SchemaVersion, ScriptVersion, CollectionTimestampUtc, SubscriptionId,
                               OriginalFileName, ManifestJson, PackageBytes
                           )
                           VALUES
                           (
                               @PackageId, @TenantId, @WorkspaceId, @ProjectId, @RunId, @CreatedUtc,
                               @SchemaVersion, @ScriptVersion, @CollectionTimestampUtc, @SubscriptionId,
                               @OriginalFileName, @ManifestJson, @PackageBytes
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
                    record.SchemaVersion,
                    record.ScriptVersion,
                    record.CollectionTimestampUtc,
                    record.SubscriptionId,
                    record.OriginalFileName,
                    record.ManifestJson,
                    record.PackageBytes,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    public async Task<AzureExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1)
                               PackageId,
                               SchemaVersion,
                               CollectionTimestampUtc,
                               CreatedUtc,
                               SubscriptionId,
                               OriginalFileName
                           FROM dbo.AzureExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND RunId = @RunId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId,
                },
                cancellationToken: cancellationToken));

        if (row is null || row.PackageId == Guid.Empty)

            return null;

        DateTime effectiveCreated = row.CreatedUtc.Kind == DateTimeKind.Utc ? row.CreatedUtc : row.CreatedUtc.ToUniversalTime();

        DateTime? collectionUtc = row.CollectionTimestampUtc is null ? null : DateTime.SpecifyKind(row.CollectionTimestampUtc.Value, DateTimeKind.Utc);

        return new AzureExtractorPackageProvenance
        {
            PackageId = row.PackageId,
            SchemaVersion = row.SchemaVersion,
            CollectionTimestampUtc = collectionUtc,
            CreatedUtc = effectiveCreated,
            SubscriptionId = string.IsNullOrWhiteSpace(row.SubscriptionId) ? null : row.SubscriptionId,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
        };
    }

    public async Task<bool> HasAnyInWorkspaceAsync(ScopeContext scope, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM dbo.AzureExtractorPackages
                               WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                           ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        bool exists = await conn.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId },
                cancellationToken: cancellationToken));

        return exists;
    }

    public async Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1) CollectionTimestampUtc
                           FROM dbo.AzureExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND CollectionTimestampUtc IS NOT NULL
                           ORDER BY CollectionTimestampUtc DESC, CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DateTime? row = await conn.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return DateTime.SpecifyKind(row.Value, DateTimeKind.Utc);
    }

    public async Task<string?> TryGetLatestScriptVersionInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1) ScriptVersion
                           FROM dbo.AzureExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND ScriptVersion IS NOT NULL
                           ORDER BY CollectionTimestampUtc DESC, CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<string?>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));
    }

    public async Task<AzureExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT PackageId, RunId, OriginalFileName, PackageBytes
                           FROM dbo.AzureExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND PackageId = @PackageId;
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
                    PackageId = packageId,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (row is null || row.PackageId == Guid.Empty)
            return null;

        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = row.PackageId,
            RunId = row.RunId,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
            PackageBytes = row.PackageBytes ?? [],
        };
    }

    public async Task<AzureExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1) PackageId, RunId, OriginalFileName, PackageBytes
                           FROM dbo.AzureExtractorPackages
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DownloadRow? row = await conn.QuerySingleOrDefaultAsync<DownloadRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (row is null || row.PackageId == Guid.Empty)
            return null;

        return new AzureExtractorPackageDownloadRecord
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
            init;
        }

        public Guid? RunId
        {
            get;
            init;
        }

        public string? OriginalFileName
        {
            get;
            init;
        }

        public byte[]? PackageBytes
        {
            get;
            init;
        }
    }


    private sealed class Row

    {
        public Guid PackageId
        {
            get;
            init;
        }


        public int SchemaVersion
        {
            get;
            init;
        }


        public DateTime? CollectionTimestampUtc
        {
            get;
            init;
        }


        public DateTime CreatedUtc
        {
            get;
            init;
        }


        public string? SubscriptionId
        {
            get;
            init;
        }


        public string? OriginalFileName
        {
            get;
            init;
        }
    }
}
