using System.Data;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Governance;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class GovernanceApprovalRequestRepository
{
    public async Task<GovernanceApprovalRequest?> GetByIdAsync(
        string approvalRequestId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      SELECT
                          ApprovalRequestId,
                          RunId,
                          TenantId,
                          WorkspaceId,
                          ProjectId,
                          ManifestVersion,
                          SourceEnvironment,
                          TargetEnvironment,
                          Status,
                          RequestedBy,
                          RequestedByActorKey,
                          ReviewedBy,
                          ReviewedByActorKey,
                          RequestComment,
                          ReviewComment,
                          RequestedUtc,
                          ReviewedUtc,
                          SlaDeadlineUtc,
                          SlaBreachNotifiedUtc
                      FROM GovernanceApprovalRequests
                      WHERE ApprovalRequestId = @ApprovalRequestId{scopeSql};
                      """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters p = new();
        p.Add("ApprovalRequestId", approvalRequestId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        return await connection.QuerySingleOrDefaultAsync<GovernanceApprovalRequest>(new CommandDefinition(
            sql,
            p,
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<GovernanceApprovalRequest>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      SELECT
                          ApprovalRequestId,
                          RunId,
                          TenantId,
                          WorkspaceId,
                          ProjectId,
                          ManifestVersion,
                          SourceEnvironment,
                          TargetEnvironment,
                          Status,
                          RequestedBy,
                          RequestedByActorKey,
                          ReviewedBy,
                          ReviewedByActorKey,
                          RequestComment,
                          ReviewComment,
                          RequestedUtc,
                          ReviewedUtc,
                          SlaDeadlineUtc,
                          SlaBreachNotifiedUtc
                      FROM GovernanceApprovalRequests
                      WHERE {RepositoryRunIdPredicate.WhereClauseMatching("RunId")}{scopeSql}
                      ORDER BY RequestedUtc DESC
                      {SqlPagingSyntax.FirstRowsOnly(200)};
                      """;

        DynamicParameters p = new();

        RepositoryRunIdPredicate.AddRunIdMatchParameters(p, runId);

        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        IEnumerable<GovernanceApprovalRequest> rows = await connection.QueryAsync<GovernanceApprovalRequest>(
            new CommandDefinition(
                sql,
                p,
                cancellationToken: cancellationToken));

        return [.. rows];
    }

    public async Task<IReadOnlyList<GovernanceApprovalRequest>> GetPendingAsync(
        int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      SELECT TOP (@MaxRows)
                          ApprovalRequestId,
                          RunId,
                          TenantId,
                          WorkspaceId,
                          ProjectId,
                          ManifestVersion,
                          SourceEnvironment,
                          TargetEnvironment,
                          Status,
                          RequestedBy,
                          RequestedByActorKey,
                          ReviewedBy,
                          ReviewedByActorKey,
                          RequestComment,
                          ReviewComment,
                          RequestedUtc,
                          ReviewedUtc,
                          SlaDeadlineUtc,
                          SlaBreachNotifiedUtc
                      FROM GovernanceApprovalRequests
                      WHERE Status IN (@Draft, @Submitted){scopeSql}
                      ORDER BY RequestedUtc DESC;
                      """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters p = new();
        p.Add("MaxRows", maxRows);
        p.Add("Draft", GovernanceApprovalStatus.Draft);
        p.Add("Submitted", GovernanceApprovalStatus.Submitted);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        IEnumerable<GovernanceApprovalRequest> rows = await connection.QueryAsync<GovernanceApprovalRequest>(
            new CommandDefinition(
                sql,
                p,
                cancellationToken: cancellationToken));

        return [.. rows];
    }

    public async Task<IReadOnlyList<GovernanceApprovalRequest>> GetRecentDecisionsAsync(
        int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      SELECT TOP (@MaxRows)
                          ApprovalRequestId,
                          RunId,
                          TenantId,
                          WorkspaceId,
                          ProjectId,
                          ManifestVersion,
                          SourceEnvironment,
                          TargetEnvironment,
                          Status,
                          RequestedBy,
                          RequestedByActorKey,
                          ReviewedBy,
                          ReviewedByActorKey,
                          RequestComment,
                          ReviewComment,
                          RequestedUtc,
                          ReviewedUtc,
                          SlaDeadlineUtc,
                          SlaBreachNotifiedUtc
                      FROM GovernanceApprovalRequests
                      WHERE Status IN (@Approved, @Rejected, @Promoted)
                        AND ReviewedUtc IS NOT NULL{scopeSql}
                      ORDER BY ReviewedUtc DESC, ApprovalRequestId DESC;
                      """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters p = new();
        p.Add("MaxRows", maxRows);
        p.Add("Approved", GovernanceApprovalStatus.Approved);
        p.Add("Rejected", GovernanceApprovalStatus.Rejected);
        p.Add("Promoted", GovernanceApprovalStatus.Promoted);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        IEnumerable<GovernanceApprovalRequest> rows = await connection.QueryAsync<GovernanceApprovalRequest>(
            new CommandDefinition(
                sql,
                p,
                cancellationToken: cancellationToken));

        return [.. rows];
    }

    public async Task<IReadOnlyList<GovernanceApprovalRequest>> GetPendingSlaBreachedAsync(
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      SELECT TOP 200
                          ApprovalRequestId,
                          RunId,
                          TenantId,
                          WorkspaceId,
                          ProjectId,
                          ManifestVersion,
                          SourceEnvironment,
                          TargetEnvironment,
                          Status,
                          RequestedBy,
                          RequestedByActorKey,
                          ReviewedBy,
                          ReviewedByActorKey,
                          RequestComment,
                          ReviewComment,
                          RequestedUtc,
                          ReviewedUtc,
                          SlaDeadlineUtc,
                          SlaBreachNotifiedUtc
                      FROM GovernanceApprovalRequests
                      WHERE Status IN (@Draft, @Submitted)
                        AND SlaDeadlineUtc IS NOT NULL
                        AND SlaDeadlineUtc <= @UtcNow
                        AND SlaBreachNotifiedUtc IS NULL{scopeSql}
                      ORDER BY SlaDeadlineUtc ASC;
                      """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters p = new();
        p.Add("UtcNow", utcNow, DbType.DateTime2);
        p.Add("Draft", GovernanceApprovalStatus.Draft);
        p.Add("Submitted", GovernanceApprovalStatus.Submitted);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        IEnumerable<GovernanceApprovalRequest> rows = await connection.QueryAsync<GovernanceApprovalRequest>(
            new CommandDefinition(
                sql,
                p,
                cancellationToken: cancellationToken));

        return [.. rows];
    }
}
