using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.SecureNow;

/// <summary>
/// Atomic cross-replica reservation primitive. This deliberately does not schedule
/// external collection work; reconciliation must precede service integration.
/// </summary>
public sealed class SqlCollectionTriggerClaimRepository(ISqlConnectionFactory connectionFactory)
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

    private sealed class ClaimRow
    {
        public bool Acquired { get; init; }
        public Guid RunId { get; init; }
        public byte State { get; init; }
    }
}
