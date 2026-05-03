using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.CustomerSuccess;

[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent repository.")]
public sealed class SqlCorePilotTeamChecklistRepository(
    ISqlConnectionFactory connectionFactory,
    IRlsSessionContextApplicator rlsSessionContextApplicator) : ICorePilotTeamChecklistRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IRlsSessionContextApplicator _rlsSessionContextApplicator =
        rlsSessionContextApplicator ?? throw new ArgumentNullException(nameof(rlsSessionContextApplicator));

    public async Task<IReadOnlyList<CorePilotChecklistStepRow>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await _rlsSessionContextApplicator.ApplyAsync(connection, cancellationToken);

        const string sql = """
                             SELECT StepIndex, IsCompleted, UpdatedUtc, UpdatedByUserId
                             FROM dbo.CorePilotTeamChecklist
                             WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                             ORDER BY StepIndex;
                             """;

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return rows
            .Select(static r => new CorePilotChecklistStepRow(
                r.StepIndex,
                r.IsCompleted,
                new DateTimeOffset(r.UpdatedUtc, TimeSpan.Zero),
                r.UpdatedByUserId))
            .ToList();
    }

    public async Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int stepIndex,
        bool isCompleted,
        string? updatedByUserId,
        CancellationToken cancellationToken)
    {
        if (stepIndex is < 0 or > 3)
            throw new ArgumentOutOfRangeException(nameof(stepIndex));

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await _rlsSessionContextApplicator.ApplyAsync(connection, cancellationToken);

        const string sql = """
                             MERGE dbo.CorePilotTeamChecklist AS t
                             USING (SELECT @TenantId AS TenantId, @WorkspaceId AS WorkspaceId, @ProjectId AS ProjectId,
                                           @StepIndex AS StepIndex) AS s
                             ON t.TenantId = s.TenantId
                                AND t.WorkspaceId = s.WorkspaceId
                                AND t.ProjectId = s.ProjectId
                                AND t.StepIndex = s.StepIndex
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     IsCompleted = @IsCompleted,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByUserId = @UpdatedByUserId
                             WHEN NOT MATCHED THEN
                                 INSERT (TenantId, WorkspaceId, ProjectId, StepIndex, IsCompleted, UpdatedUtc, UpdatedByUserId)
                                 VALUES (@TenantId, @WorkspaceId, @ProjectId, @StepIndex, @IsCompleted, SYSUTCDATETIME(), @UpdatedByUserId);
                             """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    StepIndex = stepIndex,
                    IsCompleted = isCompleted,
                    UpdatedByUserId = updatedByUserId
                },
                cancellationToken: cancellationToken));
    }

    private sealed class Row
    {
        public int StepIndex { get; init; }
        public bool IsCompleted { get; init; }
        public DateTime UpdatedUtc { get; init; }
        public string? UpdatedByUserId { get; init; }
    }
}
