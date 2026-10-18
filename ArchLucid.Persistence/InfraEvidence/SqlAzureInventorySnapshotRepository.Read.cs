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

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string batchSql = """
                                SELECT TOP (1)
                                    s.SnapshotId, s.TenantId, s.WorkspaceId, s.ProjectId, s.PackageId,
                                    COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) AS SubscriptionId,
                                    s.SubscriptionName, s.CapturedUtc, s.CaptureStatus, s.CaptureVersion,
                                    s.ResourceCount, s.RelationshipCount, s.CaptureMethod, s.CollectorVersion,
                                    s.RequestedBy, s.DurationMs, s.CompletenessScore, s.WarningCount, s.CompletenessWarningsJson, s.ErrorCount,
                                    s.ContentHashSha256, s.CreatedUtc, s.UpdatedUtc,
                                    JSON_VALUE(p.ManifestJson, '$.subscriptionName') AS ManifestSubscriptionName,
                                    sibling.SiblingSubscriptionName
                                FROM dbo.AzureInventorySnapshots s
                                LEFT JOIN dbo.AzureExtractorPackages p
                                    ON p.PackageId = s.PackageId
                                    AND p.TenantId = s.TenantId
                                    AND p.WorkspaceId = s.WorkspaceId
                                    AND p.ProjectId = s.ProjectId
                                OUTER APPLY (
                                    SELECT TOP (1)
                                        COALESCE(
                                            sib.SubscriptionName,
                                            JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                        ) AS SiblingSubscriptionName
                                    FROM dbo.AzureInventorySnapshots sib
                                    LEFT JOIN dbo.AzureExtractorPackages pSib
                                        ON pSib.PackageId = sib.PackageId
                                        AND pSib.TenantId = sib.TenantId
                                        AND pSib.WorkspaceId = sib.WorkspaceId
                                        AND pSib.ProjectId = sib.ProjectId
                                    WHERE sib.TenantId = s.TenantId
                                        AND sib.WorkspaceId = s.WorkspaceId
                                        AND sib.ProjectId = s.ProjectId
                                        AND sib.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                        AND COALESCE(
                                            sib.SubscriptionId,
                                            JSON_VALUE(pSib.ManifestJson, '$.subscriptionId')
                                        ) = COALESCE(
                                            s.SubscriptionId,
                                            JSON_VALUE(p.ManifestJson, '$.subscriptionId')
                                        )
                                        AND COALESCE(
                                            sib.SubscriptionName,
                                            JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                        ) IS NOT NULL
                                    ORDER BY COALESCE(sib.CapturedUtc, sib.CreatedUtc) DESC
                                ) sibling
                                WHERE s.TenantId = @TenantId
                                    AND s.WorkspaceId = @WorkspaceId
                                    AND s.ProjectId = @ProjectId
                                    AND s.SnapshotId = @SnapshotId;

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
        {
            return null;
        }

        AzureInventorySnapshotRecord header = Map(headerRow);
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
