using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

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
            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            const string updateHeader = """
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
                                        WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                        """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    updateHeader,
                    new
                    {
                        scope.TenantId,
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

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }
}
