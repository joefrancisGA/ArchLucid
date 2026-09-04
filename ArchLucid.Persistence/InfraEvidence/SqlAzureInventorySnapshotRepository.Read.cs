using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
            return null;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string resourcesSql = """
                                    SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                           ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                           SourceEvidenceReference
                                    FROM dbo.AzureInventoryResources
                                    WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                    """;

        IEnumerable<AzureInventoryResourceRecord> resources = await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                resourcesSql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        const string propertiesSql = """
                                     SELECT ResourceRowId, PropertyKey, PropertyValue, IsRedacted
                                     FROM dbo.AzureInventoryResourceProperties
                                     WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                     """;

        IEnumerable<AzureInventoryResourcePropertyReadModel> properties =
            await conn.QueryAsync<AzureInventoryResourcePropertyReadModel>(
                new CommandDefinition(
                    propertiesSql,
                    new { scope.TenantId, SnapshotId = snapshotId },
                    cancellationToken: cancellationToken));

        const string tagsSql = """
                               SELECT ResourceRowId, TagKey, TagValue
                               FROM dbo.AzureInventoryTags
                               WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                               """;

        IEnumerable<AzureInventoryTagReadModel> tags = await conn.QueryAsync<AzureInventoryTagReadModel>(
            new CommandDefinition(
                tagsSql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        const string relationshipsSql = """
                                        SELECT FromAzureResourceId, ToAzureResourceId, RelationshipType, ProvenanceKind
                                        FROM dbo.AzureInventoryResourceRelationships
                                        WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                        """;

        IEnumerable<RelationshipRow> relationshipRows = await conn.QueryAsync<RelationshipRow>(
            new CommandDefinition(
                relationshipsSql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        const string roleAssignmentsSql = """
                                          SELECT Scope, PrincipalId, RoleDefinitionId
                                          FROM dbo.AzureInventoryRoleAssignments
                                          WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                          """;

        IEnumerable<AzureInventoryRoleAssignmentReadModel> roleAssignments =
            await conn.QueryAsync<AzureInventoryRoleAssignmentReadModel>(
                new CommandDefinition(
                    roleAssignmentsSql,
                    new { scope.TenantId, SnapshotId = snapshotId },
                    cancellationToken: cancellationToken));

        const string diagnosticsSql = """
                                      SELECT TargetAzureResourceId, DiagnosticName, WorkspaceResourceId
                                      FROM dbo.AzureInventoryDiagnosticConfigurations
                                      WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                      """;

        IEnumerable<AzureInventoryDiagnosticConfigurationReadModel> diagnostics =
            await conn.QueryAsync<AzureInventoryDiagnosticConfigurationReadModel>(
                new CommandDefinition(
                    diagnosticsSql,
                    new { scope.TenantId, SnapshotId = snapshotId },
                    cancellationToken: cancellationToken));

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = header,
            Resources = resources.ToList(),
            Properties = properties.ToList(),
            Tags = tags.ToList(),
            Relationships = relationshipRows
                .Select(r => new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = r.FromAzureResourceId,
                    ToAzureResourceId = r.ToAzureResourceId,
                    RelationshipType = r.RelationshipType,
                    ProvenanceKind = (ProvenanceKind)r.ProvenanceKind,
                })
                .ToList(),
            RoleAssignments = roleAssignments.ToList(),
            Diagnostics = diagnostics.ToList(),
        };
    }

    private sealed class RelationshipRow
    {
        public string FromAzureResourceId
        {
            get;
            init;
        } = string.Empty;

        public string ToAzureResourceId
        {
            get;
            init;
        } = string.Empty;

        public string RelationshipType
        {
            get;
            init;
        } = string.Empty;

        public int ProvenanceKind
        {
            get;
            init;
        }
    }
}
