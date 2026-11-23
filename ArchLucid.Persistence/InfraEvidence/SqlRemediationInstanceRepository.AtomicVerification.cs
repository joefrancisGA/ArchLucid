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

        if (mutation.ExpectedRowVersion is not { Length: 8 })
            throw new InvalidOperationException(
                "Scoped remediation mutation requires an eight-byte expected rowversion.");

        if (mutation.InstanceId != evidence.InstanceId || scope.TenantId != evidence.TenantId)
            throw new InvalidOperationException("Verification evidence and mutation must refer to the same scoped instance.");

        // The procedure atomically verifies state and appends the paired evidence.
        // The runtime principal has no direct UPDATE permission on instances.
        await using SqlConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int updated = await connection.QuerySingleAsync<int>(new CommandDefinition(
            "dbo.uspRemediationCommitVerification",
            new
            {
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                mutation.InstanceId,
                mutation.ExpectedRowVersion,
                Status = (int)mutation.Status,
                mutation.VerificationSnapshotId,
                mutation.VerificationResultJson,
                mutation.VerifiedUtc,
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
                "Scoped remediation verification must update exactly one instance.");

    }
}
