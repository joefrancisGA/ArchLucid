using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<AzureInventorySnapshotDetailReadModel?> TryGetAdvisoryTerraformVisibleSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        AzureInventorySnapshotDetailReadModel? snapshot = await TryGetInventoryGraphSliceAsync(
            scope, snapshotId, cancellationToken);
        return snapshot is null ? null : AzureInventoryVisibleSnapshotProjection.Apply(snapshot, retainIdentityDiagramArmTypes: false);
    }

    public Task<AzureInventorySnapshotDetailReadModel?> TryGetPublicIpAssessmentInventoryAsync(
        ScopeContext scope, Guid snapshotId, CancellationToken cancellationToken = default) =>
        TryGetInventoryGraphSliceAsync(scope, snapshotId, cancellationToken);

    private async Task<AzureInventorySnapshotDetailReadModel?> TryGetInventoryGraphSliceAsync(
        ScopeContext scope, Guid snapshotId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
            return null;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string batchSql = $"""
                                {SnapshotHeaderSelectSql};

                                SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                       ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                       SourceEvidenceReference
                                FROM dbo.AzureInventoryResources
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT ResourceRowId, PropertyKey, PropertyValue, IsRedacted
                                FROM dbo.AzureInventoryResourceProperties
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT FromAzureResourceId, ToAzureResourceId, RelationshipType, ProvenanceKind, InferenceSource
                                FROM dbo.AzureInventoryResourceRelationships
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                """;

        using SqlMapper.GridReader reader = await conn.QueryMultipleAsync(
            new CommandDefinition(
                batchSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotId = snapshotId,
                    SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
                    PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
                },
                cancellationToken: cancellationToken));

        Row? headerRow = (await reader.ReadAsync<Row>()).FirstOrDefault();

        if (headerRow is null)
            return null;

        AzureInventorySnapshotRecord header = Map(headerRow);
        List<AzureInventoryResourceRecord> resources =
            (await reader.ReadAsync<AzureInventoryResourceRecord>()).ToList();
        List<AzureInventoryResourcePropertyReadModel> properties =
            (await reader.ReadAsync<AzureInventoryResourcePropertyReadModel>()).ToList();
        List<AzureInventoryResourceRelationshipReadModel> relationships =
            (await reader.ReadAsync<RelationshipRow>())
            .Select(r => new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = r.FromAzureResourceId,
                ToAzureResourceId = r.ToAzureResourceId,
                RelationshipType = r.RelationshipType,
                ProvenanceKind = (ProvenanceKind)r.ProvenanceKind,
                InferenceSource = r.InferenceSource,
            })
            .ToList();

        return new AzureInventorySnapshotDetailReadModel()
        {
            Header = header,
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };
    }
}
