using ArchLucid.Core.AzureExtractor;
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
        AzureInventorySnapshotDetailReadModel? snapshot =
            await TryGetCanonicalSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        return snapshot is null ? null : AzureInventoryVisibleSnapshotProjection.Apply(snapshot);
    }

    public async Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
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

        const string gridsSql = """
                                SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                       ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                       SourceEvidenceReference
                                FROM dbo.AzureInventoryResources
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT ResourceRowId, PropertyKey, PropertyValue, IsRedacted
                                FROM dbo.AzureInventoryResourceProperties
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT ResourceRowId, TagKey, TagValue
                                FROM dbo.AzureInventoryTags
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT FromAzureResourceId, ToAzureResourceId, RelationshipType, ProvenanceKind, InferenceSource
                                FROM dbo.AzureInventoryResourceRelationships
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT ExternalNodeKey, LinkedServiceName, LinkedServiceType, TargetHost,
                                       FactoryResourceId, IntegrationRuntimeName, HostInKeyVault, KeyVaultResourceId
                                FROM dbo.AzureInventoryAdfExternalSources
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT Scope, PrincipalId, RoleDefinitionId, RoleDefinitionName, PimEligibilityKind
                                FROM dbo.AzureInventoryRoleAssignments
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT TargetAzureResourceId, DiagnosticName, WorkspaceResourceId
                                FROM dbo.AzureInventoryDiagnosticConfigurations
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT ResourceId, SecureScore, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderSummaries
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                """;

        using SqlMapper.GridReader reader = await conn.QueryMultipleAsync(
            new CommandDefinition(
                gridsSql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        List<AzureInventoryResourceRecord> resources =
            (await reader.ReadAsync<AzureInventoryResourceRecord>()).ToList();
        List<AzureInventoryResourcePropertyReadModel> properties =
            (await reader.ReadAsync<AzureInventoryResourcePropertyReadModel>()).ToList();
        List<AzureInventoryTagReadModel> tags =
            (await reader.ReadAsync<AzureInventoryTagReadModel>()).ToList();
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
        List<AzureInventoryAdfExternalSourceReadModel> externalSources =
            (await reader.ReadAsync<AzureInventoryAdfExternalSourceReadModel>()).ToList();
        List<AzureInventoryRoleAssignmentReadModel> roleAssignments =
            (await reader.ReadAsync<AzureInventoryRoleAssignmentReadModel>()).ToList();
        List<AzureInventoryDiagnosticConfigurationReadModel> diagnostics =
            (await reader.ReadAsync<AzureInventoryDiagnosticConfigurationReadModel>()).ToList();
        List<AzureInventoryDefenderSummaryReadModel> defenderSummaries =
            (await reader.ReadAsync<AzureInventoryDefenderSummaryReadModel>()).ToList();

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = header,
            Resources = resources,
            Properties = properties,
            Tags = tags,
            Relationships = relationships,
            AdfExternalSources = externalSources,
            RoleAssignments = roleAssignments,
            Diagnostics = diagnostics,
            DefenderSummaries = defenderSummaries,
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

        public string? InferenceSource
        {
            get;
            init;
        }
    }
}
