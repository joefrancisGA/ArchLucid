using ArchLucid.Core.Scoping;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.SecureNow;

/// <summary>
/// Atomic cross-replica reservation primitive. This deliberately does not schedule
/// external collection work; reconciliation must precede service integration.
/// </summary>
public sealed class SqlCollectionTriggerClaimRepository(ISqlConnectionFactory connectionFactory) : ICollectionTriggerClaimRepository
{
    public async Task<(bool Acquired, Guid RunId, byte State)> TryReserveAsync(
        ProjectScopeKey scope,
        string idempotencyKey,
        Guid proposedRunId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);
        string key = idempotencyKey.Trim();
        if (key.Length > 256)
            throw new ArgumentOutOfRangeException(nameof(idempotencyKey), "Idempotency key exceeds 256 characters.");
        if (proposedRunId == Guid.Empty)
            throw new ArgumentException("A nonempty run ID is required.", nameof(proposedRunId));

        const string sql = """
            SET XACT_ABORT ON;
            BEGIN TRANSACTION;
            DECLARE @Acquired BIT = 0;
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.SecureNowCollectionTriggerClaims WITH (UPDLOCK, HOLDLOCK)
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ProjectId AND IdempotencyKey = @IdempotencyKey
            )
            BEGIN
                INSERT dbo.SecureNowCollectionTriggerClaims
                    (TenantId, WorkspaceId, ProjectId, IdempotencyKey, RunId, ClaimState)
                VALUES (@TenantId, @WorkspaceId, @ProjectId, @IdempotencyKey, @RunId, 0);
                SET @Acquired = 1;
            END;
            SELECT @Acquired AS Acquired, RunId, ClaimState AS State
            FROM dbo.SecureNowCollectionTriggerClaims
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId AND IdempotencyKey = @IdempotencyKey;
            COMMIT TRANSACTION;
            """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ClaimRow row = await connection.QuerySingleAsync<ClaimRow>(new CommandDefinition(
            sql,
            new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, IdempotencyKey = key, RunId = proposedRunId },
            cancellationToken: cancellationToken));
        return (row.Acquired, row.RunId, row.State);
    }

    /// <summary>Only the winning run may mark a pending claim scheduled.</summary>
    public async Task<bool> MarkScheduledAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);
        if (runId == Guid.Empty)
            throw new ArgumentException("Run ID is required.", nameof(runId));

        const string sql = """
            UPDATE dbo.SecureNowCollectionTriggerClaims
               SET ClaimState = 1, UpdatedUtc = SYSUTCDATETIME()
             WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
               AND ProjectId = @ProjectId AND IdempotencyKey = @IdempotencyKey
               AND RunId = @RunId AND ClaimState = 0;
            """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            sql, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                IdempotencyKey = idempotencyKey.Trim(), RunId = runId },
            cancellationToken: cancellationToken)) == 1;
    }

    /// <summary>
    /// Reconcile only from an already persisted, matching collection run.
    /// This never invokes Azure Automation or automatically retries a pending claim.
    /// </summary>
    public async Task<bool> ReconcilePersistedRunAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);
        if (runId == Guid.Empty)
            throw new ArgumentException("Run ID is required.", nameof(runId));

        const string sql = """
            UPDATE claim
               SET ClaimState = 1, UpdatedUtc = SYSUTCDATETIME()
              FROM dbo.SecureNowCollectionTriggerClaims AS claim
             WHERE claim.TenantId = @TenantId
               AND claim.WorkspaceId = @WorkspaceId
               AND claim.ProjectId = @ProjectId
               AND claim.IdempotencyKey = @IdempotencyKey
               AND claim.RunId = @RunId
               AND claim.ClaimState = 0
               AND EXISTS (
                   SELECT 1 FROM dbo.SecureNowCollectionRuns AS run
                   WHERE run.TenantId = claim.TenantId
                     AND run.WorkspaceId = claim.WorkspaceId
                     AND run.ProjectId = claim.ProjectId
                     AND run.RunId = claim.RunId
               );
            """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            sql, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                IdempotencyKey = idempotencyKey.Trim(), RunId = runId },
            cancellationToken: cancellationToken)) == 1;
    }

    private sealed class ClaimRow
    {
        public bool Acquired { get; init; }
        public Guid RunId { get; init; }
        public byte State { get; init; }
    }
}
