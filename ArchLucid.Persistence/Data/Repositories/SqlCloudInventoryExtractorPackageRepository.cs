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

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                CloudInventoryExtractorPackageRepositoryCore.InsertSql,
                CloudInventoryExtractorPackageRepositoryCore.CreateInsertArgs(record),
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

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CloudInventoryExtractorPackageDownloadRecord? row =
            await conn.QuerySingleOrDefaultAsync<CloudInventoryExtractorPackageDownloadRecord>(
                new CommandDefinition(
                    CloudInventoryExtractorPackageRepositoryCore.DownloadByPackageIdSelectSql,
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

        return row;
    }

    public async Task<CloudInventoryExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!CloudInventoryExtractorPackageRepositoryCore.IsSupportedProvider(cloudProvider))
            return null;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CloudInventoryExtractorPackageProvenanceRow? row =
            await conn.QuerySingleOrDefaultAsync<CloudInventoryExtractorPackageProvenanceRow>(
                new CommandDefinition(
                    CloudInventoryExtractorPackageRepositoryCore.LatestProvenanceByRunSelectSql,
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

        return row is null ? null : CloudInventoryExtractorPackageRepositoryCore.MapProvenance(row);
    }

    public async Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!CloudInventoryExtractorPackageRepositoryCore.IsSupportedProvider(cloudProvider))
            return null;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DateTime? row = await conn.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(
                CloudInventoryExtractorPackageRepositoryCore.LatestCollectionTimestampSelectSql,
                CloudInventoryExtractorPackageRepositoryCore.CreateScopeProviderArgs(scope, cloudProvider),
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        return CloudInventoryExtractorPackageRepositoryCore.NormalizeCollectionTimestampUtc(row);
    }

    public async Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!CloudInventoryExtractorPackageRepositoryCore.IsSupportedProvider(cloudProvider))
            return null;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CloudInventoryExtractorPackageDownloadRow? row =
            await conn.QuerySingleOrDefaultAsync<CloudInventoryExtractorPackageDownloadRow>(
                new CommandDefinition(
                    CloudInventoryExtractorPackageRepositoryCore.LatestDownloadInScopeSelectSql,
                    CloudInventoryExtractorPackageRepositoryCore.CreateScopeProviderArgs(scope, cloudProvider),
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

        return CloudInventoryExtractorPackageRepositoryCore.MapDownload(row);
    }
}
