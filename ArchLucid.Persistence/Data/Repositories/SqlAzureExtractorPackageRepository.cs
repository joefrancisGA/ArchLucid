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
                    PackageBytes = record.PackageBytes,
                },
                cancellationToken: cancellationToken));
    }
}
