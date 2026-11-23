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

        // The stored procedure owns the approval UPDATE and evidence INSERT in
        // one transaction. The app identity cannot UPDATE the table directly.
        await using SqlConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int updated = await connection.QuerySingleAsync<int>(new CommandDefinition(
            "dbo.uspRemediationCommitApproval",
            new
            {
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                mutation.InstanceId,
                mutation.ExpectedRowVersion,
                mutation.ApprovedByActorKey,
                mutation.ApprovedUtc,
                mutation.UpdatedUtc,
                evidence.EvidenceId,
                evidence.PayloadJson,
                evidence.ActorKey,
                evidence.CorrelationId,
                evidence.CreatedUtc,
            },
            commandType: System.Data.CommandType.StoredProcedure,
            cancellationToken: cancellationToken));
        if (updated != 1)
            throw new InvalidOperationException(
                "Scoped remediation approval was stale, foreign or no longer preflight-passed.");

    }
}
