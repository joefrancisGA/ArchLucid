using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArchitectureIntelligence;

public sealed class SqlArchitectureIntelligenceStandaloneRunStore(ISqlConnectionFactory connectionFactory)
    : IArchitectureIntelligenceStandaloneRunStore
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task BindNewAsync(
        ScopeContext scope,
        Guid runId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO dbo.ArchitectureIntelligenceStandaloneRuns
                (RunId, TenantId, WorkspaceId, ProjectId, ActorKeyHash)
            VALUES (@RunId, @TenantId, @WorkspaceId, @ProjectId, @ActorKeyHash);
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql, BuildParameters(scope, runId, actorId), cancellationToken: cancellationToken));
    }

    public async Task<bool> IsOwnedByAsync(
        ScopeContext scope,
        Guid runId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT CAST(CASE WHEN EXISTS (
                SELECT 1 FROM dbo.ArchitectureIntelligenceStandaloneRuns
                WHERE RunId = @RunId AND TenantId = @TenantId
                    AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                    AND ActorKeyHash = @ActorKeyHash
            ) THEN 1 ELSE 0 END AS bit);
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql, BuildParameters(scope, runId, actorId), cancellationToken: cancellationToken));
    }

    private static object BuildParameters(ScopeContext scope, Guid runId, string actorId) => new
    {
        RunId = runId,
        scope.TenantId,
        scope.WorkspaceId,
        scope.ProjectId,
        ActorKeyHash = SHA256.HashData(Encoding.UTF8.GetBytes(actorId)),
    };
}
