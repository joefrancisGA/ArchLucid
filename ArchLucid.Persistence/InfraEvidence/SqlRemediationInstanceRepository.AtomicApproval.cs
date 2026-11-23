using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationInstanceRepository
{
    /// <summary>
    /// Approval and its audit-adjacent provenance must succeed or roll back
    /// together. This binds a frozen pattern/preflight reference, NOT an
    /// independently approved FND-015 forward/rollback plan.
    /// </summary>
    public async Task CommitApprovalInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        RemediationEvidenceRecord evidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mutation);
        ArgumentNullException.ThrowIfNull(evidence);
        cancellationToken.ThrowIfCancellationRequested();

        if (mutation.InstanceId == Guid.Empty ||
            evidence.EvidenceId == Guid.Empty ||
            mutation.InstanceId != evidence.InstanceId ||
            scope.TenantId != evidence.TenantId ||
            mutation.Status != RemediationInstanceStatus.Approved ||
            evidence.Phase != RemediationEvidencePhase.Approval ||
            mutation.ExpectedRowVersion is not { Length: 8 } ||
            string.IsNullOrWhiteSpace(mutation.ApprovedByActorKey) ||
            mutation.ApprovedUtc is null ||
            mutation.ApprovedUtc.Value != evidence.CreatedUtc ||
            !string.Equals(mutation.ApprovedByActorKey, evidence.ActorKey, StringComparison.Ordinal) ||
            string.IsNullOrWhiteSpace(evidence.PayloadJson) ||
            string.IsNullOrWhiteSpace(evidence.CorrelationId))
        {
            throw new InvalidOperationException(
                "Scoped approval requires a matching actor, evidence and expected rowversion.");
        }

        const string updateSql = """
            UPDATE dbo.RemediationInstances
            SET Status = @ApprovedStatus,
                ApprovedByActorKey = @ApprovedByActorKey,
                ApprovedUtc = @ApprovedUtc,
                UpdatedUtc = @UpdatedUtc
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND InstanceId = @InstanceId
              AND Status = @PreflightPassedStatus
              AND RowVersion = @ExpectedRowVersion
              AND PreflightSnapshotId IS NOT NULL
              AND PreflightResultJson IS NOT NULL
              AND LEN(LTRIM(RTRIM(PreflightResultJson))) > 0
              AND LOWER(LTRIM(RTRIM(CreatedByActorKey))) <> LOWER(@ApprovedByActorKey);
            """;
        const string insertEvidenceSql = """
            INSERT INTO dbo.RemediationEvidence
                (EvidenceId, InstanceId, TenantId, Phase, PayloadJson,
                 ActorKey, CorrelationId, CreatedUtc)
            VALUES
                (@EvidenceId, @InstanceId, @TenantId, @Phase, @PayloadJson,
                 @ActorKey, @CorrelationId, @CreatedUtc);
            """;

        await using SqlConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        int updated = await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new
            {
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                mutation.InstanceId,
                mutation.ExpectedRowVersion,
                ApprovedStatus = (int)RemediationInstanceStatus.Approved,
                PreflightPassedStatus = (int)RemediationInstanceStatus.PreflightPassed,
                mutation.ApprovedByActorKey,
                mutation.ApprovedUtc,
                mutation.UpdatedUtc,
            },
            transaction: transaction,
            cancellationToken: cancellationToken));
        if (updated != 1)
        {
            throw new InvalidOperationException(
                "Scoped remediation approval was stale, foreign or no longer preflight-passed.");
        }

        await connection.ExecuteAsync(new CommandDefinition(
            insertEvidenceSql,
            new
            {
                evidence.EvidenceId,
                evidence.InstanceId,
                evidence.TenantId,
                Phase = (int)evidence.Phase,
                evidence.PayloadJson,
                evidence.ActorKey,
                evidence.CorrelationId,
                evidence.CreatedUtc,
            },
            transaction: transaction,
            cancellationToken: cancellationToken));

        await transaction.CommitAsync(cancellationToken);
    }
}
