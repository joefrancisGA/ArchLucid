using ArchLucid.Core.Scoping;
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
