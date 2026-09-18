using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.NotFound,
            };
        }

        using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using SqlTransaction transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            const string existsSql = """
                                     SELECT COUNT(1)
                                     FROM dbo.AzureInventorySnapshots
                                     WHERE TenantId = @TenantId
                                       AND WorkspaceId = @WorkspaceId
                                       AND ProjectId = @ProjectId
                                       AND SnapshotId = @SnapshotId;
                                     """;

            int exists = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(
                    existsSql,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        SnapshotId = snapshotId,
                    },
                    transaction,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (exists == 0)
            {
                await transaction.RollbackAsync(cancellationToken);

                return new AzureInventorySnapshotDeleteResult
                {
                    Outcome = AzureInventorySnapshotDeleteOutcome.NotFound,
                };
            }

            AzureInventorySnapshotDeleteResult? blocked = await TryGetDeleteBlockReasonAsync(
                connection,
                transaction,
                scope,
                snapshotId,
                cancellationToken);

            if (blocked is not null)
            {
                await transaction.RollbackAsync(cancellationToken);

                return blocked;
            }

            await CascadeDeleteSnapshotRowsAsync(
                connection,
                transaction,
                scope,
                snapshotId,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.Deleted,
            };
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);

            throw;
        }
    }

    private static async Task<AzureInventorySnapshotDeleteResult?> TryGetDeleteBlockReasonAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        const string bindingCountSql = """
                                       SELECT COUNT(1)
                                       FROM dbo.ArchitectureInventoryBindings
                                       WHERE TenantId = @TenantId
                                         AND SnapshotId = @SnapshotId;
                                       """;

        int bindingCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                bindingCountSql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                },
                transaction,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (bindingCount > 0)
        {
            return new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.BlockedBoundToArchitecture,
                BlockingReferenceCount = bindingCount,
            };
        }

        const string auditLinkCountSql = """
                                         SELECT COUNT(1)
                                         FROM dbo.AuditEvidenceSnapshotInventoryLinks
                                         WHERE TenantId = @TenantId
                                           AND AzureInventorySnapshotId = @SnapshotId;
                                         """;

        int auditLinkCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                auditLinkCountSql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                },
                transaction,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (auditLinkCount > 0)
        {
            return new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.BlockedReferencedByAuditEvidence,
                BlockingReferenceCount = auditLinkCount,
            };
        }

        const string remediationCountSql = """
                                           SELECT COUNT(1)
                                           FROM dbo.RemediationInstances
                                           WHERE TenantId = @TenantId
                                             AND (
                                                 PreflightSnapshotId = @SnapshotId
                                                 OR ExecutionSnapshotId = @SnapshotId
                                                 OR VerificationSnapshotId = @SnapshotId);
                                           """;

        int remediationCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                remediationCountSql,
                new
                {
                    scope.TenantId,
                    SnapshotId = snapshotId,
                },
                transaction,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        if (remediationCount > 0)
        {
            return new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.BlockedReferencedByRemediationInstance,
                BlockingReferenceCount = remediationCount,
            };
        }

        return null;
    }

    private static async Task CascadeDeleteSnapshotRowsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            SnapshotId = snapshotId,
        };

        const string deleteDriftApprovalsSql = """
                                               DELETE FROM dbo.AzureInventoryDriftApprovals
                                               WHERE TenantId = @TenantId
                                                 AND DiffId IN (
                                                     SELECT DiffId
                                                     FROM dbo.AzureInventoryDiffs
                                                     WHERE TenantId = @TenantId
                                                       AND (SnapshotAId = @SnapshotId OR SnapshotBId = @SnapshotId));
                                               """;

        const string deleteDiffNarrativesSql = """
                                               DELETE FROM dbo.AzureInventoryDiffNarratives
                                               WHERE TenantId = @TenantId
                                                 AND DiffId IN (
                                                     SELECT DiffId
                                                     FROM dbo.AzureInventoryDiffs
                                                     WHERE TenantId = @TenantId
                                                       AND (SnapshotAId = @SnapshotId OR SnapshotBId = @SnapshotId));
                                               """;

        const string deleteDiffChangesSql = """
                                            DELETE FROM dbo.AzureInventoryChanges
                                            WHERE TenantId = @TenantId
                                              AND DiffId IN (
                                                  SELECT DiffId
                                                  FROM dbo.AzureInventoryDiffs
                                                  WHERE TenantId = @TenantId
                                                    AND (SnapshotAId = @SnapshotId OR SnapshotBId = @SnapshotId));
                                            """;

        const string deleteDiffsSql = """
                                      DELETE FROM dbo.AzureInventoryDiffs
                                      WHERE TenantId = @TenantId
                                        AND (SnapshotAId = @SnapshotId OR SnapshotBId = @SnapshotId);
                                      """;

        const string deletePathRanksSql = """
                                          DELETE FROM dbo.SecurityEvidencePathRanks
                                          WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                          """;

        const string deletePathHopsSql = """
                                         DELETE FROM dbo.SecurityEvidencePathHops
                                         WHERE TenantId = @TenantId
                                           AND PathId IN (
                                               SELECT PathId
                                               FROM dbo.SecurityEvidencePaths
                                               WHERE TenantId = @TenantId
                                                 AND SnapshotId = @SnapshotId);
                                         """;

        const string clearRemediationPathIdsSql = """
                                                  UPDATE dbo.RemediationInstances
                                                  SET PathId = NULL
                                                  WHERE TenantId = @TenantId
                                                    AND PathId IN (
                                                        SELECT PathId
                                                        FROM dbo.SecurityEvidencePaths
                                                        WHERE TenantId = @TenantId
                                                          AND SnapshotId = @SnapshotId);
                                                  """;

        const string deleteSecurityPathsSql = """
                                              DELETE FROM dbo.SecurityEvidencePaths
                                              WHERE TenantId = @TenantId
                                                AND SnapshotId = @SnapshotId;
                                              """;

        const string deleteCutPointsSql = """
                                          DELETE FROM dbo.SecurityEvidenceCutPoints
                                          WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                          """;

        const string deleteAdvisoryTerraformSql = """
                                                  DELETE FROM dbo.AdvisoryTerraformResourceMappings
                                                  WHERE TenantId = @TenantId
                                                    AND SnapshotId = @SnapshotId;
                                                  """;

        const string deleteBaselinesSql = """
                                          DELETE FROM dbo.AzureInventoryBaselines
                                          WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                          """;

        const string deleteDiagramReconciliationsSql = """
                                                       DELETE FROM dbo.ArchitectureDiagramReconciliations
                                                       WHERE TenantId = @TenantId
                                                         AND SnapshotId = @SnapshotId;
                                                       """;

        const string deleteAuditEvaluationsSql = """
                                                 DELETE FROM dbo.AuditControlEvaluations
                                                 WHERE TenantId = @TenantId
                                                   AND SnapshotId = @SnapshotId;
                                                 """;

        const string clearCloudResourceIdentitySnapshotPointersSql = """
                                                                     UPDATE dbo.CloudResourceIdentities
                                                                     SET FirstSeenSnapshotId = CASE WHEN FirstSeenSnapshotId = @SnapshotId THEN NULL ELSE FirstSeenSnapshotId END,
                                                                         LastSeenSnapshotId = CASE WHEN LastSeenSnapshotId = @SnapshotId THEN NULL ELSE LastSeenSnapshotId END
                                                                     WHERE TenantId = @TenantId
                                                                       AND (FirstSeenSnapshotId = @SnapshotId OR LastSeenSnapshotId = @SnapshotId);
                                                                     """;

        const string deleteTagsSql = """
                                     DELETE FROM dbo.AzureInventoryTags
                                     WHERE TenantId = @TenantId
                                       AND SnapshotId = @SnapshotId;
                                     """;

        const string deletePropertiesSql = """
                                           DELETE FROM dbo.AzureInventoryResourceProperties
                                           WHERE TenantId = @TenantId
                                             AND SnapshotId = @SnapshotId;
                                           """;

        const string deleteResourcesSql = """
                                          DELETE FROM dbo.AzureInventoryResources
                                          WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                          """;

        const string deleteRelationshipsSql = """
                                              DELETE FROM dbo.AzureInventoryResourceRelationships
                                              WHERE TenantId = @TenantId
                                                AND SnapshotId = @SnapshotId;
                                              """;

        const string deleteIdentitiesSql = """
                                           DELETE FROM dbo.AzureInventoryIdentities
                                           WHERE TenantId = @TenantId
                                             AND SnapshotId = @SnapshotId;
                                           """;

        const string deleteRoleAssignmentsSql = """
                                                DELETE FROM dbo.AzureInventoryRoleAssignments
                                                WHERE TenantId = @TenantId
                                                  AND SnapshotId = @SnapshotId;
                                                """;

        const string deleteDiagnosticsSql = """
                                            DELETE FROM dbo.AzureInventoryDiagnosticConfigurations
                                            WHERE TenantId = @TenantId
                                              AND SnapshotId = @SnapshotId;
                                            """;

        const string deleteUnknownResourcesSql = """
                                                 DELETE FROM dbo.AzureInventoryUnknownResources
                                                 WHERE TenantId = @TenantId
                                                   AND SnapshotId = @SnapshotId;
                                                 """;

        const string deleteDefenderSummariesSql = """
                                                  DELETE FROM dbo.AzureInventoryDefenderSummaries
                                                  WHERE TenantId = @TenantId
                                                    AND SnapshotId = @SnapshotId;
                                                  """;

        const string deleteSnapshotHeaderSql = """
                                               DELETE FROM dbo.AzureInventorySnapshots
                                               WHERE TenantId = @TenantId
                                                 AND WorkspaceId = @WorkspaceId
                                                 AND ProjectId = @ProjectId
                                                 AND SnapshotId = @SnapshotId;
                                               """;

        string[] statements =
        [
            deleteDriftApprovalsSql,
            deleteDiffNarrativesSql,
            deleteDiffChangesSql,
            deleteDiffsSql,
            deletePathRanksSql,
            deletePathHopsSql,
            clearRemediationPathIdsSql,
            deleteSecurityPathsSql,
            deleteCutPointsSql,
            deleteAdvisoryTerraformSql,
            deleteBaselinesSql,
            deleteDiagramReconciliationsSql,
            deleteAuditEvaluationsSql,
            clearCloudResourceIdentitySnapshotPointersSql,
            deleteTagsSql,
            deletePropertiesSql,
            deleteResourcesSql,
            deleteRelationshipsSql,
            deleteIdentitiesSql,
            deleteRoleAssignmentsSql,
            deleteDiagnosticsSql,
            deleteUnknownResourcesSql,
            deleteDefenderSummariesSql,
            deleteSnapshotHeaderSql,
        ];

        foreach (string sql in statements)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    parameters,
                    transaction,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));
        }
    }
}
