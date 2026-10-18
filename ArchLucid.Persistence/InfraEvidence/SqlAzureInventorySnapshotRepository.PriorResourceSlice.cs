using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<(IReadOnlyList<AzureInventoryResourceRecord> Resources, IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties)>
        ListResourcesAndPropertiesByCloudResourceIdsAsync(
            ScopeContext scope,
            Guid snapshotId,
            IReadOnlyList<Guid> cloudResourceIds,
            CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        List<Guid> distinctIds = cloudResourceIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (snapshotId == Guid.Empty || distinctIds.Count == 0)
            return ([], []);

        const string resourceSql = """
                                   SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                          ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                          SourceEvidenceReference
                                   FROM dbo.AzureInventoryResources
                                   WHERE TenantId = @TenantId
                                     AND SnapshotId = @SnapshotId
                                     AND CloudResourceId IN @CloudResourceIds;
                                   """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        List<AzureInventoryResourceRecord> resources = (await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                resourceSql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                    CloudResourceIds = distinctIds,
                },
                cancellationToken: cancellationToken))).ToList();

        if (resources.Count == 0)
            return ([], []);

        List<Guid> resourceRowIds = resources.Select(item => item.ResourceRowId).ToList();

        const string propertySql = """
                                   SELECT ResourceRowId, PropertyKey, PropertyValue, IsRedacted
                                   FROM dbo.AzureInventoryResourceProperties
                                   WHERE TenantId = @TenantId
                                     AND SnapshotId = @SnapshotId
                                     AND ResourceRowId IN @ResourceRowIds;
                                   """;

        List<AzureInventoryResourcePropertyReadModel> properties =
            (await conn.QueryAsync<AzureInventoryResourcePropertyReadModel>(
                new CommandDefinition(
                    propertySql,
                    new
                    {
                        scope.TenantId,
                        SnapshotId = snapshotId,
                        ResourceRowIds = resourceRowIds,
                    },
                    cancellationToken: cancellationToken))).ToList();

        return (resources, properties);
    }
}
