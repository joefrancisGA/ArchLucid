using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(writeRequest);

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Snapshot materialize requires SqlConnection.");

        using SqlTransaction tx = sqlConn.BeginTransaction();

        try
        {
            if (writeRequest.AnalysisRecovery is not null && await IsRecoveryCaptureReplayAsync(
                sqlConn, tx, scope, snapshotId, writeRequest.ContentHashSha256, cancellationToken))
            {
                tx.Commit();

                return;
            }

            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            const string updateHeader = """
                                        DECLARE @UpdatedSnapshots TABLE (SnapshotId UNIQUEIDENTIFIER NOT NULL);

                                        UPDATE dbo.AzureInventorySnapshots
                                        SET CaptureStatus = @CaptureStatus,
                                            ResourceCount = @ResourceCount,
                                            RelationshipCount = @RelationshipCount,
                                            CompletenessScore = @CompletenessScore,
                                            WarningCount = @WarningCount,
                                            CompletenessWarningsJson = @CompletenessWarningsJson,
                                            ErrorCount = @ErrorCount,
                                            ContentHashSha256 = @ContentHashSha256,
                                            CaptureMethod = @CaptureMethod,
                                            CollectorVersion = @CollectorVersion,
                                            SubscriptionId = COALESCE(SubscriptionId, @SubscriptionId),
                                            SubscriptionName = COALESCE(SubscriptionName, @SubscriptionName),
                                            UpdatedUtc = @UpdatedUtc
                                        OUTPUT inserted.SnapshotId INTO @UpdatedSnapshots
                                        WHERE TenantId = @TenantId
                                            AND WorkspaceId = @WorkspaceId
                                            AND ProjectId = @ProjectId
                                            AND SnapshotId = @SnapshotId;

                                        SELECT SnapshotId FROM @UpdatedSnapshots;
                                        """;

            Guid? updatedSnapshot = await sqlConn.QuerySingleOrDefaultAsync<Guid?>(
                new CommandDefinition(
                    updateHeader,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        SnapshotId = snapshotId,
                        CaptureStatus = (int)writeRequest.CaptureStatus,
                        writeRequest.ResourceCount,
                        writeRequest.RelationshipCount,
                        writeRequest.CompletenessScore,
                        writeRequest.WarningCount,
                        writeRequest.CompletenessWarningsJson,
                        writeRequest.ErrorCount,
                        writeRequest.ContentHashSha256,
                        CaptureMethod = (int)writeRequest.CaptureMethod,
                        writeRequest.CollectorVersion,
                        writeRequest.SubscriptionId,
                        writeRequest.SubscriptionName,
                        UpdatedUtc = utcNow,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (updatedSnapshot is null)
                throw new InvalidOperationException("Snapshot header was not found in the current scope.");

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryResources",
                writeRequest.Resources.Select(resource => new
                {
                    resource.ResourceRowId,
                    resource.SnapshotId,
                    resource.TenantId,
                    resource.CloudResourceId,
                    resource.AzureResourceId,
                    resource.ResourceType,
                    resource.Region,
                    resource.ResourceGroup,
                    resource.SubscriptionId,
                    resource.ParentResourceId,
                    resource.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryResourceProperties",
                writeRequest.Properties.Select(property => new
                {
                    PropertyRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    property.ResourceRowId,
                    property.PropertyKey,
                    property.PropertyValue,
                    property.IsRedacted,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryTags",
                writeRequest.Tags.Select(tag => new
                {
                    TagRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    tag.ResourceRowId,
                    tag.TagKey,
                    tag.TagValue,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryResourceRelationships",
                writeRequest.Relationships.Select(relationship => new
                {
                    RelationshipRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    relationship.FromAzureResourceId,
                    relationship.ToAzureResourceId,
                    relationship.RelationshipType,
                    ProvenanceKind = (int)relationship.ProvenanceKind,
                    relationship.Confidence,
                    relationship.InferenceSource,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryAdfExternalSources",
                writeRequest.AdfExternalSources.Select(source => new
                {
                    ExternalSourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    source.ExternalNodeKey,
                    source.LinkedServiceName,
                    source.LinkedServiceType,
                    source.TargetHost,
                    source.FactoryResourceId,
                    source.IntegrationRuntimeName,
                    source.HostInKeyVault,
                    source.KeyVaultResourceId,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryRoleAssignments",
                writeRequest.RoleAssignments.Select(roleAssignment => new
                {
                    RoleAssignmentRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    roleAssignment.Scope,
                    roleAssignment.PrincipalId,
                    roleAssignment.RoleDefinitionId,
                    roleAssignment.RoleDefinitionName,
                    roleAssignment.PimEligibilityKind,
                    roleAssignment.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDiagnosticConfigurations",
                writeRequest.Diagnostics.Select(diagnostic => new
                {
                    DiagnosticRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    diagnostic.TargetAzureResourceId,
                    diagnostic.DiagnosticName,
                    diagnostic.WorkspaceResourceId,
                    diagnostic.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryUnknownResources",
                writeRequest.UnknownResources.Select(unknown => new
                {
                    UnknownResourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    unknown.AzureResourceId,
                    unknown.ResourceType,
                    unknown.ResourceGroup,
                    unknown.CappedPropertiesJson,
                    unknown.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderSummaries",
                writeRequest.DefenderSummaries.Select(defenderSummary => new
                {
                    DefenderSummaryRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    defenderSummary.ResourceId,
                    defenderSummary.SecureScore,
                    defenderSummary.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderPricings",
                writeRequest.DefenderPricings.Select(row => new
                {
                    DefenderPricingRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.PricingName,
                    row.Tier,
                    row.Extensions,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderScoreControls",
                writeRequest.DefenderScoreControls.Select(row => new
                {
                    DefenderScoreControlRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.ScoreName,
                    row.ControlName,
                    row.DisplayName,
                    row.CurrentScore,
                    row.MaxScore,
                    row.Percentage,
                    row.Weight,
                    row.UnhealthyResourceCount,
                    row.HealthyResourceCount,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderAssessments",
                writeRequest.DefenderAssessments.Select(row => new
                {
                    DefenderAssessmentRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.AssessmentKey,
                    row.DisplayName,
                    row.Severity,
                    row.Status,
                    row.StatusCause,
                    row.Category,
                    row.ResourceId,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderAssessmentCounts",
                writeRequest.DefenderAssessmentCounts.Select(row => new
                {
                    DefenderAssessmentCountRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.AssessmentKey,
                    row.DisplayName,
                    row.Severity,
                    row.HealthyCount,
                    row.UnhealthyCount,
                    row.NotApplicableCount,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderSecurityContacts",
                writeRequest.DefenderSecurityContacts.Select(row => new
                {
                    DefenderSecurityContactRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.CollectionStatus,
                    row.EmailCount,
                    row.Emails,
                    row.AlertsToAdmins,
                    row.MinimalSeverity,
                    row.NotificationRoles,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderGovernanceAssignments",
                writeRequest.DefenderGovernanceAssignments.Select(row => new
                {
                    DefenderGovernanceAssignmentRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.AssessmentKey,
                    row.ResourceId,
                    row.Owner,
                    row.RemediationDueUtc,
                    row.IsGracePeriod,
                    row.AssignmentStatus,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderComplianceStandards",
                writeRequest.DefenderComplianceStandards.Select(row => new
                {
                    DefenderComplianceStandardRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.StandardName,
                    row.State,
                    row.PassedControlCount,
                    row.FailedControlCount,
                    row.SkippedControlCount,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderComplianceControls",
                writeRequest.DefenderComplianceControls.Select(row => new
                {
                    DefenderComplianceControlRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.StandardName,
                    row.ControlName,
                    row.State,
                    row.FailedAssessmentCount,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderAlerts",
                writeRequest.DefenderAlerts.Select(row => new
                {
                    DefenderAlertRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.AlertId,
                    row.DisplayName,
                    row.Severity,
                    row.Status,
                    row.Intent,
                    row.AlertType,
                    row.StartTimeUtc,
                    row.ResourceId,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderAttackPaths",
                writeRequest.DefenderAttackPaths.Select(row => new
                {
                    DefenderAttackPathRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.AttackPathId,
                    row.DisplayName,
                    row.RiskLevel,
                    row.EntryResourceIds,
                    row.TargetResourceIds,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderVulnerabilityCounts",
                writeRequest.DefenderVulnerabilityCounts.Select(row => new
                {
                    DefenderVulnerabilityCountRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.ResourceId,
                    row.CriticalCount,
                    row.HighCount,
                    row.MediumCount,
                    row.LowCount,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            await SqlBufferedBulkCopy.WriteAsync(
                sqlConn, tx, "dbo.AzureInventoryDefenderVulnerabilityFindings",
                writeRequest.DefenderVulnerabilityFindings.Select(row => new
                {
                    DefenderVulnerabilityFindingRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    scope.TenantId,
                    row.SubscriptionId,
                    row.ResourceId,
                    row.Severity,
                    row.FindingId,
                    row.DisplayName,
                    row.SourceEvidenceReference,
                }),
                cancellationToken);

            if (writeRequest.AnalysisRecovery is { } recovery)
            {
                await AdmitRecoveryWithCaptureAsync(sqlConn, tx, scope, snapshotId, recovery, cancellationToken);
            }

            cancellationToken.ThrowIfCancellationRequested();
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static async Task<bool> IsRecoveryCaptureReplayAsync(
        SqlConnection connection, SqlTransaction tx, ScopeContext scope, Guid snapshotId, byte[]? contentHash, CancellationToken ct)
    {
        const string sql = """
            SELECT CASE WHEN s.ContentHashSha256 = @ContentHash THEN 1 ELSE 2 END
            FROM dbo.SecureNowAnalysisRecoveryJobs j WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.AzureInventorySnapshots s ON s.SnapshotId = j.SnapshotId AND s.TenantId = j.TenantId
                AND s.WorkspaceId = j.WorkspaceId AND s.ProjectId = j.ProjectId
            WHERE j.TenantId = @TenantId AND j.WorkspaceId = @WorkspaceId AND j.ProjectId = @ProjectId
              AND j.SnapshotId = @SnapshotId;
            """;
        int? replay = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId, ContentHash = contentHash
        }, tx, cancellationToken: ct));

        if (replay == 2)
            throw new InvalidOperationException("A recoverable inventory capture cannot change its pinned content.");

        return replay == 1;
    }

    private static Task AdmitRecoveryWithCaptureAsync(
        SqlConnection connection, SqlTransaction tx, ScopeContext scope, Guid snapshotId,
        SecureNowAnalysisRecoveryAdmission recovery, CancellationToken ct)
    {
        const string sql = """
            INSERT dbo.SecureNowAnalysisRecoveryJobs
                (TenantId, WorkspaceId, ProjectId, SnapshotId, SubscriptionId, FullRecompute,
                 InputVersion, AdmittedUtc, DeadlineUtc)
            SELECT TenantId, WorkspaceId, ProjectId, SnapshotId, SubscriptionId, @FullRecompute,
                   @InputVersion, SYSUTCDATETIME(), DATEADD(second, @RunTimeoutSeconds, SYSUTCDATETIME())
            FROM dbo.AzureInventorySnapshots
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                AND SnapshotId = @SnapshotId;
            """;

        return connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId,
            recovery.FullRecompute, recovery.InputVersion, recovery.RunTimeoutSeconds
        }, tx, cancellationToken: ct));
    }
}
