using ArchLucid.Persistence.Connections;
using Dapper;

namespace ArchLucid.Persistence.SecureNow;

/// <summary>
/// CAP-03: fenced, SQL-backed capacity slots shared by replicas.
/// This is a coordination primitive, NOT authorization to replay external side effects.
/// </summary>
public sealed class SqlSecureNowCapacityLeaseRepository(ISqlConnectionFactory connectionFactory)
{
    public async Task<(int Slot, long Fence)?> TryAcquireAsync(
        Guid tenantId, string workloadKey, Guid ownerId, int slotCount,
        TimeSpan duration, CancellationToken cancellationToken = default)
    {
        Validate(tenantId, workloadKey, ownerId, duration);
        if (slotCount is < 1 or > 64)
            throw new ArgumentOutOfRangeException(nameof(slotCount));

        // Key-range locking serializes first insert and subsequent lease claims.
        const string sql = """
            SET XACT_ABORT ON;
            BEGIN TRANSACTION;
            DECLARE @Now DATETIME2 = SYSUTCDATETIME();
            DECLARE @Result TABLE (SlotNumber INT, FencingToken BIGINT);
            IF NOT EXISTS (
                SELECT 1 FROM dbo.SecureNowCapacityLeases WITH (UPDLOCK, HOLDLOCK)
                WHERE TenantId = @TenantId AND WorkloadKey = @WorkloadKey AND SlotNumber = @Slot
            )
            BEGIN
                INSERT dbo.SecureNowCapacityLeases
                    (TenantId, WorkloadKey, SlotNumber, OwnerId, FencingToken, ExpiresUtc)
                OUTPUT inserted.SlotNumber, inserted.FencingToken INTO @Result
                VALUES (@TenantId, @WorkloadKey, @Slot, @OwnerId, 1, DATEADD(SECOND, @DurationSeconds, @Now));
            END
            ELSE
            BEGIN
                UPDATE dbo.SecureNowCapacityLeases
                SET OwnerId = @OwnerId, FencingToken = FencingToken + 1,
                    ExpiresUtc = DATEADD(SECOND, @DurationSeconds, @Now)
                OUTPUT inserted.SlotNumber, inserted.FencingToken INTO @Result
                WHERE TenantId = @TenantId AND WorkloadKey = @WorkloadKey AND SlotNumber = @Slot
                  AND ExpiresUtc <= @Now AND FencingToken < 9223372036854775807;
            END;
            SELECT SlotNumber, FencingToken FROM @Result;
            COMMIT TRANSACTION;
            """;
        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        for (int slot = 0; slot < slotCount; slot++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            LeaseRow? row = await conn.QuerySingleOrDefaultAsync<LeaseRow>(
                new CommandDefinition(sql, new {
                    TenantId = tenantId, WorkloadKey = workloadKey, OwnerId = ownerId,
                    Slot = slot, DurationSeconds = (int)duration.TotalSeconds
                }, cancellationToken: cancellationToken));
            if (row is not null)
                return (row.SlotNumber, row.FencingToken);
        }
        return null;
    }

    public async Task<bool> RenewAsync(
        Guid tenantId, string workloadKey, Guid ownerId, int slot, long fence,
        TimeSpan duration, CancellationToken cancellationToken = default)
    {
        Validate(tenantId, workloadKey, ownerId, duration);
        ValidateLease(slot, fence);
        const string sql = """
            UPDATE dbo.SecureNowCapacityLeases
            SET ExpiresUtc = DATEADD(SECOND, @DurationSeconds, SYSUTCDATETIME())
            WHERE TenantId = @TenantId AND WorkloadKey = @WorkloadKey
              AND SlotNumber = @Slot AND OwnerId = @OwnerId AND FencingToken = @Fence
              AND ExpiresUtc > SYSUTCDATETIME();
            """;
        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await conn.ExecuteAsync(new CommandDefinition(sql, new {
            TenantId = tenantId, WorkloadKey = workloadKey, OwnerId = ownerId,
            Slot = slot, Fence = fence, DurationSeconds = (int)duration.TotalSeconds
        }, cancellationToken: cancellationToken)) == 1;
    }

    public async Task<bool> ReleaseAsync(
        Guid tenantId, string workloadKey, Guid ownerId, int slot, long fence,
        CancellationToken cancellationToken = default)
    {
        ValidateIdentity(tenantId, workloadKey, ownerId);
        ValidateLease(slot, fence);
        // Never delete the slot: fencing counters must survive releases.
        const string sql = """
            UPDATE dbo.SecureNowCapacityLeases
            SET OwnerId = NULL, ExpiresUtc = '19000101'
            WHERE TenantId = @TenantId AND WorkloadKey = @WorkloadKey
              AND SlotNumber = @Slot AND OwnerId = @OwnerId AND FencingToken = @Fence;
            """;
        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await conn.ExecuteAsync(new CommandDefinition(sql,
            new { TenantId = tenantId, WorkloadKey = workloadKey, OwnerId = ownerId,
                  Slot = slot, Fence = fence },
            cancellationToken: cancellationToken)) == 1;
    }

    private static void Validate(Guid tenantId, string key, Guid owner, TimeSpan duration)
    {
        ValidateIdentity(tenantId, key, owner);
        if (duration.TotalSeconds is < 1 or > 3600 || duration.TotalSeconds != Math.Floor(duration.TotalSeconds))
            throw new ArgumentOutOfRangeException(nameof(duration));
    }

    private static void ValidateIdentity(Guid tenantId, string key, Guid owner)
    {
        if (tenantId == Guid.Empty || owner == Guid.Empty)
            throw new ArgumentException("Tenant and owner IDs must be nonempty.");
        if (string.IsNullOrWhiteSpace(key) || key.Length > 64)
            throw new ArgumentException("Workload key must be 1–64 nonblank characters.", nameof(key));
    }

    private static void ValidateLease(int slot, long fence)
    {
        if (slot < 0 || fence < 1)
            throw new ArgumentOutOfRangeException(nameof(slot));
    }

    private sealed class LeaseRow
    {
        public int SlotNumber { get; init; }
        public long FencingToken { get; init; }
    }
}
