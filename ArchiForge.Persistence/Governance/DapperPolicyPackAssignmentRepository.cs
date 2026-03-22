using ArchiForge.Decisioning.Governance.PolicyPacks;
using ArchiForge.Persistence.Connections;
using Dapper;

namespace ArchiForge.Persistence.Governance;

public sealed class DapperPolicyPackAssignmentRepository(ISqlConnectionFactory connectionFactory)
    : IPolicyPackAssignmentRepository
{
    public async Task CreateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.PolicyPackAssignments
            (
                AssignmentId, TenantId, WorkspaceId, ProjectId,
                PolicyPackId, PolicyPackVersion, IsEnabled, ScopeLevel, IsPinned, AssignedUtc
            )
            VALUES
            (
                @AssignmentId, @TenantId, @WorkspaceId, @ProjectId,
                @PolicyPackId, @PolicyPackVersion, @IsEnabled, @ScopeLevel, @IsPinned, @AssignedUtc
            );
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, assignment, cancellationToken: ct));
    }

    public async Task UpdateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.PolicyPackAssignments
            SET IsEnabled = @IsEnabled
            WHERE AssignmentId = @AssignmentId;
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, assignment, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<PolicyPackAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
            SELECT *
            FROM dbo.PolicyPackAssignments
            WHERE TenantId = @TenantId
              AND (
                    (ScopeLevel = N'Tenant')
                 OR (ScopeLevel = N'Workspace' AND WorkspaceId = @WorkspaceId)
                 OR (ScopeLevel = N'Project' AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId)
              )
            ORDER BY AssignedUtc DESC;
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var rows = await connection.QueryAsync<PolicyPackAssignment>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));
        return rows.ToList();
    }
}
