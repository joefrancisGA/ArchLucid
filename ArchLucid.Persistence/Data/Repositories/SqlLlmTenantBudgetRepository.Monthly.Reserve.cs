using System.Data;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantBudgetRepository
{
    private async Task<LlmTenantBudgetReserveResult> ReserveMonthlyAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ReserveUsd <= 0m)
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            (int y, int m) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(request.PeriodKey);
            LlmTenantBudgetStateReadModel? cur = await SelectMonthlyAsync(c, request.TenantId, y, m, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetReserveResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetReserveResult { NewState = cur };
        }

        if (request.HardCapUsd is null)
            throw new ArgumentException("HardCapUsd is required for monthly reserve.", nameof(request));

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        (int sqlYear, int sqlMonth) = await ReadSqlUtcYearMonthAsync(connection, cancellationToken).ConfigureAwait(false);
        (int requestYear, int requestMonth) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(request.PeriodKey);
        bool periodKeyMismatch = requestYear != sqlYear || requestMonth != sqlMonth;
        string authoritativePeriodKey = LlmTenantBudgetPeriodCore.FormatUtcYearMonth(sqlYear, sqlMonth);

        await EnsureMonthlyRowAsync(connection, request.TenantId, sqlYear, sqlMonth, cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    LlmTenantBudgetSql.ReserveMonthly,
                    new
                    {
                        request.TenantId,
                        UtcYear = sqlYear,
                        UtcMonth = sqlMonth,
                        Add = request.ReserveUsd,
                        RowVersion = request.ExpectedRowVersion,
                        HardCap = request.HardCapUsd.Value
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (affected != 1)
        {
            LlmTenantBudgetReserveResult failure = await ClassifyMonthlyReserveFailureAsync(
                request.TenantId,
                sqlYear,
                sqlMonth,
                request.ExpectedRowVersion,
                request.ReserveUsd,
                request.HardCapUsd.Value,
                cancellationToken).ConfigureAwait(false);

            if (periodKeyMismatch)
            {
                return new LlmTenantBudgetReserveResult
                {
                    ConcurrencyConflict = failure.ConcurrencyConflict,
                    HardCapBlocked = failure.HardCapBlocked,
                    NewState = failure.NewState,
                    PeriodKeyMismatch = true,
                    AuthoritativePeriodKey = authoritativePeriodKey
                };
            }

            return failure;
        }

        LlmTenantBudgetStateReadModel model =
            await SelectMonthlyAsync(connection, request.TenantId, sqlYear, sqlMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after reserve.");

        return new LlmTenantBudgetReserveResult
        {
            NewState = model,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
        };

    }

    private async Task<LlmTenantBudgetReserveResult> ClassifyMonthlyReserveFailureAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        byte[] expectedRowVersion,
        decimal addUsd,
        decimal hardCap,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        LlmTenantBudgetStateReadModel? current =
            await SelectMonthlyAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        if (current is null || !current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return LlmTenantBudgetPeriodCore.IsMonthlyHardCapBlocked(
            current.CommittedUsd,
            current.ReservedUsd,
            addUsd,
            hardCap)
            ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current }
            : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
    }
}
