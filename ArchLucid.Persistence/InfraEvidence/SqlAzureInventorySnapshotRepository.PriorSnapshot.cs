using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
        ScopeContext scope,
        string subscriptionId,
        Guid newerSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(subscriptionId))
            return null;

        const string sql = """
                           SELECT TOP (1) priorSnapshot.SnapshotId
                           FROM dbo.AzureInventorySnapshots priorSnapshot
                           INNER JOIN dbo.AzureInventorySnapshots newerSnapshot
                               ON newerSnapshot.SnapshotId = @NewerSnapshotId
                               AND newerSnapshot.TenantId = @TenantId
                               AND newerSnapshot.WorkspaceId = @WorkspaceId
                               AND newerSnapshot.ProjectId = @ProjectId
                           WHERE priorSnapshot.TenantId = @TenantId
                               AND priorSnapshot.WorkspaceId = @WorkspaceId
                               AND priorSnapshot.ProjectId = @ProjectId
                               AND priorSnapshot.SubscriptionId = @SubscriptionId
                               AND priorSnapshot.SnapshotId <> @NewerSnapshotId
                               AND priorSnapshot.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                               AND priorSnapshot.ResourceCount > 0
                               AND priorSnapshot.CreatedUtc < newerSnapshot.CreatedUtc
                           ORDER BY priorSnapshot.CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Guid? priorSnapshotId = await conn.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SubscriptionId = subscriptionId,
                    NewerSnapshotId = newerSnapshotId,
                    SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
                    PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
                },
                cancellationToken: cancellationToken));

        return priorSnapshotId == Guid.Empty ? null : priorSnapshotId;
    }
}
