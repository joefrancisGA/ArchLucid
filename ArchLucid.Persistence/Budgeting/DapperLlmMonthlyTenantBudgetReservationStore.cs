using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;

using Dapper;

namespace ArchLucid.Persistence.Budgeting;

/// <inheritdoc cref="ILlmMonthlyTenantBudgetReservationStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; unit-tested via in-memory counterpart.")]
public sealed class DapperLlmMonthlyTenantBudgetReservationStore(IDbConnectionFactory connectionFactory)
    : ILlmMonthlyTenantBudgetReservationStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetReservationStoreResult> TryReserveAsync(
        LlmMonthlyTenantBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (request.ReserveUsd <= 0m)
        {
            LlmTenantBudgetStateReadModel state = await ReadMonthlyStateAsync(
                request.TenantId,
                request.PeriodKey,
                cancellationToken).ConfigureAwait(false);

            return LlmMonthlyTenantBudgetReservationStoreResult.Permit(request.ReservationId, state);
        }

        DateTime expiresUtc = request.UtcNow.Add(request.ReservationTtl).UtcDateTime;

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", request.ReservationId);
        parameters.Add("@TenantId", request.TenantId);
        parameters.Add("@PeriodKey", request.PeriodKey);
        parameters.Add("@ReserveUsd", request.ReserveUsd);
        parameters.Add("@HardCapUsd", request.HardCapUsd);
        parameters.Add("@RowVersion", request.ExpectedRowVersion);
        parameters.Add("@ExpiresUtc", expiresUtc);
        parameters.Add("@Allowed", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@ReservationIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);
        parameters.Add("@PeriodKeyMismatch", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@AuthoritativePeriodKey", dbType: DbType.String, size: 7, direction: ParameterDirection.Output);
        parameters.Add("@HardCapBlocked", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@ConcurrencyConflict", dbType: DbType.Boolean, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_LlmMonthlyTenantBudget_TryReserve",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        if (parameters.Get<bool>("@ConcurrencyConflict"))
            return LlmMonthlyTenantBudgetReservationStoreResult.RejectConcurrency();

        if (parameters.Get<bool>("@HardCapBlocked"))
        {
            string? authoritativePeriodKey = parameters.Get<string?>("@AuthoritativePeriodKey");
            string periodKey = string.IsNullOrWhiteSpace(authoritativePeriodKey) ? request.PeriodKey : authoritativePeriodKey;
            LlmTenantBudgetStateReadModel blocked = await ReadMonthlyStateAsync(
                request.TenantId,
                periodKey,
                cancellationToken).ConfigureAwait(false);

            return LlmMonthlyTenantBudgetReservationStoreResult.RejectHardCap(blocked);
        }

        if (!parameters.Get<bool>("@Allowed"))
            return LlmMonthlyTenantBudgetReservationStoreResult.RejectConcurrency();

        string settledPeriodKey = parameters.Get<string?>("@AuthoritativePeriodKey") ?? request.PeriodKey;
        LlmTenantBudgetStateReadModel newState = await ReadMonthlyStateAsync(
            request.TenantId,
            settledPeriodKey,
            cancellationToken).ConfigureAwait(false);

        return LlmMonthlyTenantBudgetReservationStoreResult.Permit(
            parameters.Get<Guid>("@ReservationIdOut"),
            newState,
            parameters.Get<bool>("@PeriodKeyMismatch"),
            parameters.Get<string?>("@AuthoritativePeriodKey"));
    }

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetReservationSettleResult> SettleAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
            return LlmMonthlyTenantBudgetReservationSettleResult.NoOp();

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", reservationId);
        parameters.Add("@ActualUsd", actualUsd);
        parameters.Add("@WarnAtUsd", warnAtUsd);
        parameters.Add("@Succeeded", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@ShouldEmitWarnAudit", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@PeriodKeyMismatch", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@AuthoritativePeriodKey", dbType: DbType.String, size: 7, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_LlmMonthlyTenantBudget_Settle",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        if (!parameters.Get<bool>("@Succeeded"))
            return LlmMonthlyTenantBudgetReservationSettleResult.Conflict();

        ReservationLookup? lookup = await LookupReservationAsync(connection, reservationId, cancellationToken)
            .ConfigureAwait(false);

        if (lookup is null)
            return LlmMonthlyTenantBudgetReservationSettleResult.Conflict();

        LlmTenantBudgetStateReadModel newState = await ReadMonthlyStateAsync(
            lookup.TenantId,
            lookup.PeriodKey,
            cancellationToken).ConfigureAwait(false);

        return LlmMonthlyTenantBudgetReservationSettleResult.Completed(
            newState,
            parameters.Get<bool>("@ShouldEmitWarnAudit"),
            parameters.Get<bool>("@PeriodKeyMismatch"),
            parameters.Get<string?>("@AuthoritativePeriodKey"));
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
            return;

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", reservationId);
        parameters.Add("@Succeeded", dbType: DbType.Boolean, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_LlmMonthlyTenantBudget_Release",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetReclaimResult> ReclaimExpiredBatchAsync(
        CancellationToken cancellationToken = default)
    {
        DynamicParameters parameters = new();
        parameters.Add("@ReclaimedCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_LlmMonthlyTenantBudget_ExpirePendingReservations",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        return new LlmMonthlyTenantBudgetReclaimResult { ReclaimedCount = parameters.Get<int>("@ReclaimedCount") };
    }

    /// <inheritdoc />
    public async Task<bool> ReconcileUnsettledAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
            return false;

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", reservationId);
        parameters.Add("@ActualUsd", actualUsd);
        parameters.Add("@WarnAtUsd", warnAtUsd);
        parameters.Add("@Succeeded", dbType: DbType.Boolean, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_LlmMonthlyTenantBudget_ReconcileUnsettled",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        return parameters.Get<bool>("@Succeeded");
    }

    private async Task<LlmTenantBudgetStateReadModel> ReadMonthlyStateAsync(
        Guid tenantId,
        string periodKey,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        (int year, int month) = ParseUtcYearMonth(periodKey);

        const string sql = """
                           SELECT SpentUsd AS CommittedUsd,
                                  ReservedAssumedUsd AS ReservedUsd,
                                  PurchasedCapBumpUsd,
                                  WarnedApproaching,
                                  RowVersion
                           FROM dbo.LlmMonthlyTenantBudgetState
                           WHERE TenantId = @TenantId
                             AND UtcYear = @UtcYear
                             AND UtcMonth = @UtcMonth;
                           """;

        LlmTenantBudgetStateReadModel? row = await connection
            .QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, UtcYear = year, UtcMonth = month },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Monthly budget row missing after reservation operation.");
    }

    private static async Task<ReservationLookup?> LookupReservationAsync(
        IDbConnection connection,
        Guid reservationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, PeriodKey
                           FROM dbo.LlmMonthlyTenantBudgetReservations
                           WHERE ReservationId = @ReservationId;
                           """;

        return await connection
            .QuerySingleOrDefaultAsync<ReservationLookup>(
                new CommandDefinition(sql, new { ReservationId = reservationId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private sealed class ReservationLookup
    {
        public Guid TenantId { get; init; }

        public string PeriodKey { get; init; } = "";
    }

    private static (int Year, int Month) ParseUtcYearMonth(string periodKey)
    {
        string[] parts = periodKey.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length != 2)
            throw new FormatException("Monthly period key must be yyyy-MM.");

        return (int.Parse(parts[0], System.Globalization.CultureInfo.InvariantCulture),
            int.Parse(parts[1], System.Globalization.CultureInfo.InvariantCulture));
    }
}
