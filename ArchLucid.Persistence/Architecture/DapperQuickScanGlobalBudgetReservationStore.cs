using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

/// <inheritdoc cref="IQuickScanGlobalBudgetReservationStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; integration-tested via in-memory counterpart.")]
public sealed class DapperQuickScanGlobalBudgetReservationStore(IDbConnectionFactory connectionFactory)
    : IQuickScanGlobalBudgetReservationStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<QuickScanGlobalBudgetReservationStoreResult> TryReserveAsync(
        QuickScanGlobalBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ReserveUsd <= 0m)
        {
            return QuickScanGlobalBudgetReservationStoreResult.Permit(request.ReservationId);
        }

        string hourKey = QuickScanGlobalBudgetBucketKeys.BuildHourBucketKey(request.UtcNow);
        string dayKey = QuickScanGlobalBudgetBucketKeys.BuildDayBucketKey(request.UtcNow);
        byte[] idempotencyHash = HashIdempotencyKey(request.IdempotencyKey);
        decimal maxHourUsd = QuickScanGlobalBudgetBucketKeys.ApplyGrace(
            request.MaxHourUsd,
            request.AccountingGracePercent);
        decimal maxDayUsd = QuickScanGlobalBudgetBucketKeys.ApplyGrace(
            request.MaxDayUsd,
            request.AccountingGracePercent);
        DateTime expiresUtc = request.UtcNow.Add(request.ReservationTtl).UtcDateTime;

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", request.ReservationId);
        parameters.Add("@IdempotencyKeyHash", idempotencyHash);
        parameters.Add("@HourBucketKey", hourKey);
        parameters.Add("@DayBucketKey", dayKey);
        parameters.Add("@ReserveUsd", request.ReserveUsd);
        parameters.Add("@MaxHourUsd", maxHourUsd);
        parameters.Add("@MaxDayUsd", maxDayUsd);
        parameters.Add("@ExpiresUtc", expiresUtc);
        parameters.Add("@Allowed", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@ReservationIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanGlobalBudget_TryReserve",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        bool allowed = parameters.Get<bool>("@Allowed");

        if (!allowed)
        {
            decimal hourReserved = await ReadBucketTotalsAsync(connection, bucketKind: 1, hourKey, cancellationToken)
                .ConfigureAwait(false);
            decimal dayReserved = await ReadBucketTotalsAsync(connection, bucketKind: 2, dayKey, cancellationToken)
                .ConfigureAwait(false);

            if (hourReserved + request.ReserveUsd > maxHourUsd)
            {
                return QuickScanGlobalBudgetReservationStoreResult.Reject(
                    QuickScanGlobalBudgetReservationStoreRejectionReason.HourlyCeilingExceeded);
            }

            if (dayReserved + request.ReserveUsd > maxDayUsd)
            {
                return QuickScanGlobalBudgetReservationStoreResult.Reject(
                    QuickScanGlobalBudgetReservationStoreRejectionReason.DailyCeilingExceeded);
            }

            return QuickScanGlobalBudgetReservationStoreResult.Reject(
                QuickScanGlobalBudgetReservationStoreRejectionReason.StoreUnavailable);
        }

        Guid reservationIdOut = parameters.Get<Guid>("@ReservationIdOut");

        return QuickScanGlobalBudgetReservationStoreResult.Permit(reservationIdOut);
    }

    /// <inheritdoc />
    public async Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
    {
        if (actualUsd < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(actualUsd));
        }

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanGlobalBudget_Commit",
                new { ReservationId = reservationId, ActualUsd = actualUsd },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanGlobalBudget_Release",
                new { ReservationId = reservationId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<QuickScanGlobalBudgetBucketSnapshot> GetBucketSnapshotAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default)
    {
        string hourKey = QuickScanGlobalBudgetBucketKeys.BuildHourBucketKey(utcNow);
        string dayKey = QuickScanGlobalBudgetBucketKeys.BuildDayBucketKey(utcNow);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        QuickScanGlobalBudgetBucketSnapshot? row = await connection.QuerySingleOrDefaultAsync<QuickScanGlobalBudgetBucketSnapshot>(
            new CommandDefinition(
                "dbo.usp_QuickScanBudget_GetSnapshot",
                new { HourBucketKey = hourKey, DayBucketKey = dayKey },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (row is null)
        {
            return new QuickScanGlobalBudgetBucketSnapshot
            {
                HourBucketKey = hourKey,
                DayBucketKey = dayKey,
            };
        }

        return row;
    }

    /// <inheritdoc />
    public async Task<QuickScanBudgetReconciliationResult> ReconcileExpiredReservationsAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default)
    {
        DynamicParameters parameters = new();
        parameters.Add("@UtcNow", utcNow.UtcDateTime);
        parameters.Add("@ExpiredCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanBudget_ReconcileExpired",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        int expiredCount = parameters.Get<int>("@ExpiredCount");

        return new QuickScanBudgetReconciliationResult
        {
            ExpiredReservationCount = expiredCount,
            ReconciledUtc = utcNow,
        };
    }

    private static async Task<decimal> ReadBucketTotalsAsync(
        IDbConnection connection,
        byte bucketKind,
        string bucketKey,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT ReservedUsd + CommittedUsd
                           FROM dbo.QuickScanGlobalBudgetBuckets
                           WHERE BucketKind = @BucketKind AND BucketKey = @BucketKey;
                           """;

        decimal? value = await connection.ExecuteScalarAsync<decimal?>(
            new CommandDefinition(
                sql,
                new { BucketKind = bucketKind, BucketKey = bucketKey },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return value ?? 0m;
    }

    private static byte[] HashIdempotencyKey(string idempotencyKey)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(idempotencyKey.Trim()));
    }
}
