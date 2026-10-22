using System.Data;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantBudgetRepository
{
    private async Task<LlmTenantBudgetSettleResult> SettleMonthlyAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        (int sqlYear, int sqlMonth) = await ReadSqlUtcYearMonthAsync(connection, cancellationToken).ConfigureAwait(false);
        (int mintedYear, int mintedMonth) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(request.PeriodKey);
        LlmTenantBudgetPeriodCore.ValidateUtcYearMonth(mintedYear, mintedMonth);
        bool periodKeyMismatch = mintedYear != sqlYear || mintedMonth != sqlMonth;
        string authoritativePeriodKey = LlmTenantBudgetPeriodCore.FormatUtcYearMonth(sqlYear, sqlMonth);

        if (request is { ActualUsd: 0m, ReleaseReservedUsd: 0m })
        {
            LlmTenantBudgetStateReadModel? cur =
                await SelectMonthlyAsync(connection, request.TenantId, mintedYear, mintedMonth, cancellationToken)
                    .ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetSettleResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetSettleResult
                {
                    NewState = cur,
                    PeriodKeyMismatch = periodKeyMismatch,
                    AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                };
        }

        MonthlySettleOutput? output = await connection
            .QuerySingleOrDefaultAsync<MonthlySettleOutput>(
                new CommandDefinition(
                    LlmTenantBudgetSql.SettleMonthly,
                    new
                    {
                        request.TenantId,
                        UtcYear = mintedYear,
                        UtcMonth = mintedMonth,
                        Actual = request.ActualUsd,
                        Release = request.ReleaseReservedUsd,
                        WarnAt = request.WarnAtUsd,
                        RowVersion = request.ExpectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (output is null)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        LlmTenantBudgetStateReadModel model =
            await SelectMonthlyAsync(connection, request.TenantId, mintedYear, mintedMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after settle.");

        bool shouldAudit = !output.OldWarned && output.OldSpent < request.WarnAtUsd && output.NewSpent >= request.WarnAtUsd;

        return new LlmTenantBudgetSettleResult
        {
            ConcurrencyConflict = false,
            NewState = model,
            ShouldEmitWarnAudit = shouldAudit,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
        };
    }

    private sealed class MonthlySettleOutput
    {
        public decimal NewSpent
        {
            get; init;
        }

        public bool NewWarned
        {
            get; init;
        }

        public decimal OldSpent
        {
            get; init;
        }

        public bool OldWarned
        {
            get; init;
        }
    }
}
