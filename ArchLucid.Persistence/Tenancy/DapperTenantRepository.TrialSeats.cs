using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{

    /// <inheritdoc />
    public async Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        const string selectSql = """
                                 SELECT TrialStatus, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed
                                 FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                                 WHERE Id = @Id;
                                 """;

        const string updateSql = """
                                 UPDATE dbo.Tenants
                                 SET TrialRunsUsed = TrialRunsUsed + 1
                                 WHERE Id = @Id
                                   AND TrialStatus = @Active
                                   AND TrialRunsLimit IS NOT NULL
                                   AND TrialRunsLimit > 0
                                   AND TrialExpiresUtc > SYSUTCDATETIME()
                                   AND TrialRunsUsed < TrialRunsLimit;
                                 """;

        if (connection is not null)
        {
            await ApplyTrialRunIncrementAsync(connection, transaction, tenantId, selectSql, updateSql, ct).ConfigureAwait(false);

            return;
        }

        await using SqlConnection owned = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await owned.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            await ApplyTrialRunIncrementAsync(owned, tran, tenantId, selectSql, updateSql, ct).ConfigureAwait(false);
            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }

    private static async Task ApplyTrialRunIncrementAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid tenantId,
        string selectSql,
        string updateSql,
        CancellationToken ct)
    {
        TrialRunGateRow? row = await connection.QuerySingleOrDefaultAsync<TrialRunGateRow>(
            new CommandDefinition(selectSql, new
            {
                Id = tenantId
            }, transaction, cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return;

        if (!string.Equals(row.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
            row.TrialRunsLimit is null ||
            row.TrialRunsLimit.Value < 1)
            return;

        if (row.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())

            throw new TrialLimitExceededException(
                TrialLimitReason.Expired,
                ComputeDaysRemaining(row.TrialExpiresUtc));

        if (row.TrialRunsUsed >= row.TrialRunsLimit.Value)

            throw new TrialLimitExceededException(
                TrialLimitReason.RunsExceeded,
                ComputeDaysRemaining(row.TrialExpiresUtc));

        int updated = await connection.ExecuteAsync(
            new CommandDefinition(
                updateSql,
                new
                {
                    Id = tenantId,
                    TrialLifecycleStatus.Active
                },
                transaction,
                cancellationToken: ct)).ConfigureAwait(false);

        if (updated == 0)

            throw new TrialLimitExceededException(
                TrialLimitReason.RunsExceeded,
                ComputeDaysRemaining(row.TrialExpiresUtc));
    }


    /// <inheritdoc />
    public async Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalKey);

        string key = principalKey.Trim();

        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        const string tenantSql = """
                                 SELECT TrialStatus, TrialSeatsLimit, TrialSeatsUsed, TrialExpiresUtc
                                 FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                                 WHERE Id = @Id;
                                 """;

        TenantSeatRow? t = await connection.QuerySingleOrDefaultAsync<TenantSeatRow>(
            new CommandDefinition(tenantSql, new
            {
                Id = tenantId
            }, tran, cancellationToken: ct)).ConfigureAwait(false);

        if (t is null ||
            !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
            t.TrialSeatsLimit is null ||
            t.TrialSeatsLimit.Value < 1)
        {
            await tran.CommitAsync(ct).ConfigureAwait(false);

            return;
        }

        if (t.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);

            throw new TrialLimitExceededException(
                TrialLimitReason.Expired,
                ComputeDaysRemaining(t.TrialExpiresUtc));
        }

        const string insertSql = """
                                 INSERT INTO dbo.TenantTrialSeatOccupants (TenantId, PrincipalKey, CreatedUtc)
                                 VALUES (@TenantId, @PrincipalKey, SYSUTCDATETIME());
                                 """;

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertSql, new
                {
                    TenantId = tenantId,
                    PrincipalKey = key
                }, tran,
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == 2627)
        {
            await tran.CommitAsync(ct).ConfigureAwait(false);

            return;
        }

        const string bumpSql = """
                               UPDATE dbo.Tenants
                               SET TrialSeatsUsed = TrialSeatsUsed + 1
                               WHERE Id = @Id
                                 AND TrialStatus = @Active
                                 AND TrialSeatsUsed < @SeatLimit;
                               """;

        int bumped = await connection.ExecuteAsync(
            new CommandDefinition(
                bumpSql,
                new
                {
                    Id = tenantId,
                    TrialLifecycleStatus.Active,
                    SeatLimit = t.TrialSeatsLimit.Value
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        if (bumped == 0)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    DELETE FROM dbo.TenantTrialSeatOccupants
                    WHERE TenantId = @TenantId AND PrincipalKey = @PrincipalKey;
                    """,
                    new
                    {
                        TenantId = tenantId,
                        PrincipalKey = key
                    },
                    tran,
                    cancellationToken: ct)).ConfigureAwait(false);

            await tran.RollbackAsync(ct).ConfigureAwait(false);

            throw new TrialLimitExceededException(
                TrialLimitReason.SeatsExceeded,
                ComputeDaysRemaining(t.TrialExpiresUtc));
        }

        await tran.CommitAsync(ct).ConfigureAwait(false);
    }
}
