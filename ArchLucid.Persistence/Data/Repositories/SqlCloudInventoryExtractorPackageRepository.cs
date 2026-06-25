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
}
