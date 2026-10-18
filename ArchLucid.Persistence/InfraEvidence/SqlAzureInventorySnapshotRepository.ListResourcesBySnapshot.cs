using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourcesBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
        {
            return null;
        }

        const string sql = """
                           SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                  ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                  SourceEvidenceReference
                           FROM dbo.AzureInventoryResources
                           WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryResourceRecord> rows = await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
