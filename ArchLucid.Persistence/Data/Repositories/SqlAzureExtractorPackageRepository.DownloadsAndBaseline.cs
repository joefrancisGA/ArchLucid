using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Models;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlAzureExtractorPackageRepository
{
    public async Task<bool> HasAnyInWorkspaceAsync(ScopeContext scope, CancellationToken cancellationToken = default)
    {
        WorkspaceBaselineExtractorArtifacts artifacts =
            await GetWorkspaceBaselineArtifactsAsync(scope, cancellationToken);

        return artifacts.HasAnyInWorkspace;
    }

    public async Task<WorkspaceBaselineExtractorArtifacts> GetWorkspaceBaselineArtifactsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string batchSql = """
                                SELECT CASE WHEN EXISTS (
                                    SELECT 1
                                    FROM dbo.AzureExtractorPackages
                                    WHERE TenantId = @TenantId
                                        AND WorkspaceId = @WorkspaceId
                                        AND ProjectId = @ProjectId
                                ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END;

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

        SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            new CommandDefinition(
                batchSql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));

        bool hasAny = await multi.ReadSingleAsync<bool>();
        string? scriptVersion = await multi.ReadSingleOrDefaultAsync<string?>();
        multi.Dispose();

        return new WorkspaceBaselineExtractorArtifacts(hasAny, scriptVersion);
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
}
