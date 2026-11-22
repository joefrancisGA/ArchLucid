using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Dapper;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationInstanceRepository
{
    public async Task CommitVerificationInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        RemediationEvidenceRecord evidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mutation);
        ArgumentNullException.ThrowIfNull(evidence);

        if (mutation.InstanceId != evidence.InstanceId || scope.TenantId != evidence.TenantId)
            throw new InvalidOperationException("Verification evidence and mutation must refer to the same scoped instance.");

        const string updateSql = """
            UPDATE dbo.RemediationInstances
            SET Status = @Status,
                VerificationSnapshotId = @VerificationSnapshotId,
                VerificationResultJson = @VerificationResultJson,
                VerifiedUtc = @VerifiedUtc,
                UpdatedUtc = @UpdatedUtc
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND InstanceId = @InstanceId;
            """;
        const string evidenceSql = """
            INSERT INTO dbo.RemediationEvidence
                (EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc)
            VALUES
                (@EvidenceId, @InstanceId, @TenantId, @Phase, @PayloadJson, @ActorKey, @CorrelationId, @CreatedUtc);
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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
                Status = (int)mutation.Status,
                mutation.VerificationSnapshotId,
                mutation.VerificationResultJson,
                mutation.VerifiedUtc,
                mutation.UpdatedUtc,
            },
            transaction: transaction,
            cancellationToken: cancellationToken));
        if (updated != 1)
            throw new InvalidOperationException("Scoped remediation verification must update exactly one instance.");

        await connection.ExecuteAsync(new CommandDefinition(
            evidenceSql,
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
