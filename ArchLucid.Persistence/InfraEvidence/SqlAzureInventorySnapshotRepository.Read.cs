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

                                SELECT SubscriptionId, PricingName, Tier, Extensions, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderPricings
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, ScoreName, ControlName, DisplayName, CurrentScore, MaxScore,
                                       Percentage, Weight, UnhealthyResourceCount, HealthyResourceCount, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderScoreControls
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, AssessmentKey, DisplayName, Severity, Status, StatusCause,
                                       Category, ResourceId, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderAssessments
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, AssessmentKey, DisplayName, Severity, HealthyCount,
                                       UnhealthyCount, NotApplicableCount, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderAssessmentCounts
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, CollectionStatus, EmailCount, Emails, AlertsToAdmins,
                                       MinimalSeverity, NotificationRoles, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderSecurityContacts
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, AssessmentKey, ResourceId, Owner, RemediationDueUtc,
                                       IsGracePeriod, AssignmentStatus, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderGovernanceAssignments
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, StandardName, State, PassedControlCount, FailedControlCount,
                                       SkippedControlCount, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderComplianceStandards
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, StandardName, ControlName, State, FailedAssessmentCount,
                                       SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderComplianceControls
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, AlertId, DisplayName, Severity, Status, Intent, AlertType,
                                       StartTimeUtc, ResourceId, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderAlerts
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, AttackPathId, DisplayName, RiskLevel, EntryResourceIds,
                                       TargetResourceIds, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderAttackPaths
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, ResourceId, CriticalCount, HighCount, MediumCount, LowCount,
                                       SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderVulnerabilityCounts
                                WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                SELECT SubscriptionId, ResourceId, Severity, FindingId, DisplayName, SourceEvidenceReference
                                FROM dbo.AzureInventoryDefenderVulnerabilityFindings
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
        List<AzureInventoryDefenderPricingReadModel> defenderPricings =
            (await reader.ReadAsync<AzureInventoryDefenderPricingReadModel>()).ToList();
        List<AzureInventoryDefenderScoreControlReadModel> defenderScoreControls =
            (await reader.ReadAsync<AzureInventoryDefenderScoreControlReadModel>()).ToList();
        List<AzureInventoryDefenderAssessmentReadModel> defenderAssessments =
            (await reader.ReadAsync<AzureInventoryDefenderAssessmentReadModel>()).ToList();
        List<AzureInventoryDefenderAssessmentCountReadModel> defenderAssessmentCounts =
            (await reader.ReadAsync<AzureInventoryDefenderAssessmentCountReadModel>()).ToList();
        List<AzureInventoryDefenderSecurityContactReadModel> defenderSecurityContacts =
            (await reader.ReadAsync<AzureInventoryDefenderSecurityContactReadModel>()).ToList();
        List<AzureInventoryDefenderGovernanceAssignmentReadModel> defenderGovernanceAssignments =
            (await reader.ReadAsync<AzureInventoryDefenderGovernanceAssignmentReadModel>()).ToList();
        List<AzureInventoryDefenderComplianceStandardReadModel> defenderComplianceStandards =
            (await reader.ReadAsync<AzureInventoryDefenderComplianceStandardReadModel>()).ToList();
        List<AzureInventoryDefenderComplianceControlReadModel> defenderComplianceControls =
            (await reader.ReadAsync<AzureInventoryDefenderComplianceControlReadModel>()).ToList();
        List<AzureInventoryDefenderAlertReadModel> defenderAlerts =
            (await reader.ReadAsync<AzureInventoryDefenderAlertReadModel>()).ToList();
        List<AzureInventoryDefenderAttackPathReadModel> defenderAttackPaths =
            (await reader.ReadAsync<AzureInventoryDefenderAttackPathReadModel>()).ToList();
        List<AzureInventoryDefenderVulnerabilityCountReadModel> defenderVulnerabilityCounts =
            (await reader.ReadAsync<AzureInventoryDefenderVulnerabilityCountReadModel>()).ToList();
        List<AzureInventoryDefenderVulnerabilityFindingReadModel> defenderVulnerabilityFindings =
            (await reader.ReadAsync<AzureInventoryDefenderVulnerabilityFindingReadModel>()).ToList();

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
            DefenderPricings = defenderPricings,
            DefenderScoreControls = defenderScoreControls,
            DefenderAssessments = defenderAssessments,
            DefenderAssessmentCounts = defenderAssessmentCounts,
            DefenderSecurityContacts = defenderSecurityContacts,
            DefenderGovernanceAssignments = defenderGovernanceAssignments,
            DefenderComplianceStandards = defenderComplianceStandards,
            DefenderComplianceControls = defenderComplianceControls,
            DefenderAlerts = defenderAlerts,
            DefenderAttackPaths = defenderAttackPaths,
            DefenderVulnerabilityCounts = defenderVulnerabilityCounts,
            DefenderVulnerabilityFindings = defenderVulnerabilityFindings,
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
