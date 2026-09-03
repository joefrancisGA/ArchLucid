using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Persists authority <see cref="DecisionTraceDto" /> (rule audit) into <c>dbo.DecisioningTraces</c>
///     (not the retired coordinator <c>DecisionTraces</c> table dropped in migration 296).
///     JSON columns are <c>NVARCHAR(MAX)</c> with rowstore PAGE compression (migration 088).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlDecisionTraceRepository(ISqlConnectionFactory connectionFactory) : IDecisionTraceRepository
{
    public async Task SaveAsync(
        DecisionTraceDto trace,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        RuleAuditTracePayload audit = DecisionTraceRepositoryCore.RequireRuleAudit(trace);
        PersistenceTenantScope.RequireEntityTenant(audit.TenantId);

        object args = DecisionTraceRepositoryCore.CreateInsertArgs(audit);

        if (connection is not null)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(DecisionTraceRepositoryCore.InsertSql, args, transaction, cancellationToken: ct));
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await owned.ExecuteAsync(new CommandDefinition(DecisionTraceRepositoryCore.InsertSql, args, cancellationToken: ct));
    }

    public async Task<DecisionTraceDto?> GetByIdAsync(ScopeContext scope, Guid decisionTraceId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        string sql = $"""
            SELECT {DecisionTraceRepositoryCore.SelectColumns}
            FROM dbo.DecisioningTraces
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ScopeProjectId
              AND DecisionTraceId = @DecisionTraceId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        DecisionTraceRow? row = await connection.QuerySingleOrDefaultAsync<DecisionTraceRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, ScopeProjectId = scope.ProjectId, DecisionTraceId = decisionTraceId },
                flags: CommandFlags.None,
                cancellationToken: ct));

        return row is null ? null : DecisionTraceRepositoryCore.MapRow(row);
    }
}
