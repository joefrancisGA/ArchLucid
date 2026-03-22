using ArchiForge.Decisioning.Governance.PolicyPacks;
using ArchiForge.Persistence.Connections;
using Dapper;

namespace ArchiForge.Persistence.Governance;

public sealed class DapperPolicyPackRepository(ISqlConnectionFactory connectionFactory) : IPolicyPackRepository
{
    public async Task CreateAsync(PolicyPack pack, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.PolicyPacks
            (
                PolicyPackId, TenantId, WorkspaceId, ProjectId,
                Name, Description, PackType, Status,
                CreatedUtc, ActivatedUtc, CurrentVersion
            )
            VALUES
            (
                @PolicyPackId, @TenantId, @WorkspaceId, @ProjectId,
                @Name, @Description, @PackType, @Status,
                @CreatedUtc, @ActivatedUtc, @CurrentVersion
            );
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, pack, cancellationToken: ct));
    }

    public async Task UpdateAsync(PolicyPack pack, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.PolicyPacks
            SET
                Name = @Name,
                Description = @Description,
                PackType = @PackType,
                Status = @Status,
                ActivatedUtc = @ActivatedUtc,
                CurrentVersion = @CurrentVersion
            WHERE PolicyPackId = @PolicyPackId;
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, pack, cancellationToken: ct));
    }

    public async Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct)
    {
        const string sql = """
            SELECT *
            FROM dbo.PolicyPacks
            WHERE PolicyPackId = @PolicyPackId;
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<PolicyPack>(
            new CommandDefinition(sql, new { PolicyPackId = policyPackId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
            SELECT *
            FROM dbo.PolicyPacks
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY CreatedUtc DESC;
            """;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var rows = await connection.QueryAsync<PolicyPack>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));
        return rows.ToList();
    }
}
