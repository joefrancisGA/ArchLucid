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
    public async Task CreateAsync(
        GovernanceApprovalRequest item,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(item);

        ApplyScopeToNewRow(item);

        const string sql = """
                           INSERT INTO GovernanceApprovalRequests
                           (
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
                           )
                           VALUES
                           (
                               @ApprovalRequestId,
                               @RunId,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @ManifestVersion,
                               @SourceEnvironment,
                               @TargetEnvironment,
                               @Status,
                               @RequestedBy,
                               @RequestedByActorKey,
                               @ReviewedBy,
                               @ReviewedByActorKey,
                               @RequestComment,
                               @ReviewComment,
                               @RequestedUtc,
                               @ReviewedUtc,
                               @SlaDeadlineUtc,
                               @SlaBreachNotifiedUtc
                           );
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (item.TenantId != Guid.Empty)
            {
                await GovernanceTenantScopePriming.MergeTenantForScopeAsync(
                    conn,
                    transaction,
                    item.TenantId,
                    cancellationToken);
            }

            // Columns are DATETIME2; default SqlClient mapping uses legacy datetime and overflows near DateTime.MaxValue
            // (contract tests use ceiling ticks for stable ORDER BY).
            DynamicParameters parameters = new();
            parameters.Add("ApprovalRequestId", item.ApprovalRequestId);
            parameters.Add("RunId", item.RunId);
            parameters.Add("TenantId", item.TenantId);
            parameters.Add("WorkspaceId", item.WorkspaceId);
            parameters.Add("ProjectId", item.ProjectId);
            parameters.Add("ManifestVersion", item.ManifestVersion);
            parameters.Add("SourceEnvironment", item.SourceEnvironment);
            parameters.Add("TargetEnvironment", item.TargetEnvironment);
            parameters.Add("Status", item.Status);
            parameters.Add("RequestedBy", item.RequestedBy);
            parameters.Add("RequestedByActorKey", item.RequestedByActorKey);
            parameters.Add("ReviewedBy", item.ReviewedBy);
            parameters.Add("ReviewedByActorKey", item.ReviewedByActorKey);
            parameters.Add("RequestComment", item.RequestComment);
            parameters.Add("ReviewComment", item.ReviewComment);
            parameters.Add("RequestedUtc", item.RequestedUtc, DbType.DateTime2);
            parameters.Add("ReviewedUtc", item.ReviewedUtc, DbType.DateTime2);
            parameters.Add("SlaDeadlineUtc", item.SlaDeadlineUtc, DbType.DateTime2);
            parameters.Add("SlaBreachNotifiedUtc", item.SlaBreachNotifiedUtc, DbType.DateTime2);

            // Named CommandDefinition slots so Dapper always enlists transaction (positional + cancellationToken can
            // mis-bind overloads on some SDKs; unenlisted INSERTs break FK checks vs same-session MERGE).
            await conn.ExecuteAsync(
                new CommandDefinition(
                    commandText: sql,
                    parameters: parameters,
                    transaction: transaction,
                    commandTimeout: DapperCommandTimeoutSeconds.Standard,
                    commandType: null,
                    flags: CommandFlags.Buffered,
                    cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task<bool> TryTransitionFromReviewableAsync(
        string approvalRequestId,
        string newStatus,
        string reviewedBy,
        string? reviewedByActorKey,
        string? reviewComment,
        DateTime reviewedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);
        ArgumentException.ThrowIfNullOrWhiteSpace(newStatus);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedBy);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        // @@ROWCOUNT batch: pooled sessions often inherit SET NOCOUNT ON, so ExecuteAsync's return value is unreliable
        // for matched-row detection under concurrent Serializable transitions (contract test expects exactly one winner).
        string updateSql = $"""
                            UPDATE dbo.GovernanceApprovalRequests
                            SET
                                Status = @NewStatus,
                                ReviewedBy = @ReviewedBy,
                                ReviewedByActorKey = @ReviewedByActorKey,
                                ReviewComment = @ReviewComment,
                                ReviewedUtc = @ReviewedUtc
                            WHERE ApprovalRequestId = @ApprovalRequestId
                              AND (Status = @Draft OR Status = @Submitted){scopeSql};
                            SELECT @@ROWCOUNT;
                            """;

        DynamicParameters transitionParams = new();
        transitionParams.Add("ApprovalRequestId", approvalRequestId);
        transitionParams.Add("NewStatus", newStatus);
        transitionParams.Add("ReviewedBy", reviewedBy);
        transitionParams.Add("ReviewedByActorKey", reviewedByActorKey);
        transitionParams.Add("ReviewComment", reviewComment);
        transitionParams.Add("ReviewedUtc", reviewedUtc, DbType.DateTime2);
        transitionParams.Add("Draft", GovernanceApprovalStatus.Draft);
        transitionParams.Add("Submitted", GovernanceApprovalStatus.Submitted);
        PersistenceTenantScope.AddScopeTripleIfNeeded(transitionParams, scope);

        if (connection is not null)
        {
            int affectedInTx = await connection.QuerySingleAsync<int>(
                new CommandDefinition(updateSql, transitionParams, transaction, cancellationToken: cancellationToken));

            return affectedInTx == 1;
        }

        using IDbConnection ownedConnection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using IDbTransaction ownedTransaction = ownedConnection.BeginTransaction(IsolationLevel.Serializable);

        try
        {
            int affected = await ownedConnection.QuerySingleAsync<int>(
                new CommandDefinition(updateSql, transitionParams, ownedTransaction, cancellationToken: cancellationToken));

            ownedTransaction.Commit();

            return affected == 1;
        }
        catch
        {
            ownedTransaction.Rollback();
            throw;
        }
    }

    public async Task UpdateAsync(GovernanceApprovalRequest item, CancellationToken cancellationToken = default,
        IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(item);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      UPDATE GovernanceApprovalRequests
                      SET
                          Status = @Status,
                          ReviewedBy = @ReviewedBy,
                          ReviewComment = @ReviewComment,
                          ReviewedUtc = @ReviewedUtc,
                          SlaDeadlineUtc = @SlaDeadlineUtc,
                          SlaBreachNotifiedUtc = @SlaBreachNotifiedUtc
                      WHERE ApprovalRequestId = @ApprovalRequestId{scopeSql};
                      """;

        DynamicParameters p = new();
        p.Add("ApprovalRequestId", item.ApprovalRequestId);
        p.Add("Status", item.Status);
        p.Add("ReviewedBy", item.ReviewedBy);
        p.Add("ReviewComment", item.ReviewComment);
        p.Add("ReviewedUtc", item.ReviewedUtc, DbType.DateTime2);
        p.Add("SlaDeadlineUtc", item.SlaDeadlineUtc, DbType.DateTime2);
        p.Add("SlaBreachNotifiedUtc", item.SlaBreachNotifiedUtc, DbType.DateTime2);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        if (connection is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(sql, p, transaction: transaction, cancellationToken: cancellationToken));
            return;
        }

        using IDbConnection owned = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await owned.ExecuteAsync(new CommandDefinition(sql, p, cancellationToken: cancellationToken));
    }

    public async Task PatchSlaBreachNotifiedAsync(
        string approvalRequestId,
        DateTime slaBreachNotifiedUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = $"""
                      UPDATE GovernanceApprovalRequests
                      SET SlaBreachNotifiedUtc = @SlaBreachNotifiedUtc
                      WHERE ApprovalRequestId = @ApprovalRequestId{scopeSql};
                      """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters p = new();
        p.Add("ApprovalRequestId", approvalRequestId);
        p.Add("SlaBreachNotifiedUtc", slaBreachNotifiedUtc, DbType.DateTime2);
        PersistenceTenantScope.AddScopeTripleIfNeeded(p, scope);

        await connection.ExecuteAsync(new CommandDefinition(sql, p, cancellationToken: cancellationToken));
    }
}
