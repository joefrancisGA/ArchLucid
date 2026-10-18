using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty || resourceRowId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT ResourceRowId, PropertyKey, PropertyValue, IsRedacted
                           FROM dbo.AzureInventoryResourceProperties
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND ResourceRowId = @ResourceRowId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryResourcePropertyReadModel> rows =
            await conn.QueryAsync<AzureInventoryResourcePropertyReadModel>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.TenantId,
                        SnapshotId = snapshotId,
                        ResourceRowId = resourceRowId,
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<AzureInventoryTagReadModel>> ListResourceTagsByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty || resourceRowId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT ResourceRowId, TagKey, TagValue
                           FROM dbo.AzureInventoryTags
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND ResourceRowId = @ResourceRowId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryTagReadModel> rows = await conn.QueryAsync<AzureInventoryTagReadModel>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                    ResourceRowId = resourceRowId,
                },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>> ListRelationshipsTouchingAzureResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty || string.IsNullOrWhiteSpace(azureResourceId))
            return [];

        const string sql = """
                           SELECT FromAzureResourceId, ToAzureResourceId, RelationshipType, ProvenanceKind, InferenceSource
                           FROM dbo.AzureInventoryResourceRelationships
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND (FromAzureResourceId = @AzureResourceId OR ToAzureResourceId = @AzureResourceId);
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RelationshipRow> rows = await conn.QueryAsync<RelationshipRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                    AzureResourceId = azureResourceId,
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = r.FromAzureResourceId,
                ToAzureResourceId = r.ToAzureResourceId,
                RelationshipType = r.RelationshipType,
                ProvenanceKind = (ProvenanceKind)r.ProvenanceKind,
                InferenceSource = r.InferenceSource,
            })
            .ToList();
    }

    public async Task<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>> ListRoleAssignmentsForAzureResourceScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty || string.IsNullOrWhiteSpace(azureResourceId))
            return [];

        string scopePrefix = azureResourceId + "/";

        const string sql = """
                           SELECT Scope, PrincipalId, RoleDefinitionId, RoleDefinitionName, PimEligibilityKind
                           FROM dbo.AzureInventoryRoleAssignments
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND (Scope = @AzureResourceId OR Scope LIKE @ScopePrefix ESCAPE '\');
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryRoleAssignmentReadModel> rows =
            await conn.QueryAsync<AzureInventoryRoleAssignmentReadModel>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.TenantId,
                        SnapshotId = snapshotId,
                        AzureResourceId = azureResourceId,
                        ScopePrefix = scopePrefix + "%",
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
