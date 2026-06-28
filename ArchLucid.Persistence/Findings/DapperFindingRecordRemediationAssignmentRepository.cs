using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent; covered via API integration tests.")]
public sealed class DapperFindingRecordRemediationAssignmentRepository(ISqlConnectionFactory connectionFactory)
    : IFindingRecordRemediationAssignmentRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<bool> TryUpdateAssignmentAsync(
        Guid runId,
        string findingId,
        ScopeContext scope,
        string? assignedToUserId,
        DateTimeOffset? remediationDueUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        string? trimmedAssignee = string.IsNullOrWhiteSpace(assignedToUserId) ? null : assignedToUserId.Trim();

        const string sql = """
                           UPDATE fr
                           SET fr.AssignedToUserId = @AssignedToUserId,
                               fr.RemediationDueUtc = @RemediationDueUtc
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.FindingId = @FindingId
                             AND r.RunId = @RunId
                             AND r.TenantId = @TenantId
                             AND r.WorkspaceId = @WorkspaceId
                             AND r.ScopeProjectId = @ScopeProjectId
                             AND fr.TenantId = @TenantId
                             AND fr.WorkspaceId = @WorkspaceId
                             AND fr.ProjectId = @ProjectId
                             AND (r.ArchivedUtc IS NULL);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    FindingId = findingId.Trim(),
                    RunId = runId,
                    AssignedToUserId = trimmedAssignee,
                    RemediationDueUtc = remediationDueUtc?.UtcDateTime,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId
                },
                cancellationToken: ct));

        return affected > 0;
    }
}
