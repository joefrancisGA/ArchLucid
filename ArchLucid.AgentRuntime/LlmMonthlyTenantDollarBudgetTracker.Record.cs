using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

public sealed partial class LlmMonthlyTenantDollarBudgetTracker
{
    public async Task RecordUsageAndMaybeWarnAsync(
        Guid tenantId,
        string providerKind,
        IScopeContextProvider scopeProvider,
        IAuditService? auditService,
        int promptTokens,
        int completionTokens,
        decimal? pendingReservedUsd,
        bool overageActive,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        if (overageActive)
        {
            decimal? walletUsd = _costEstimator.EstimateUsd(promptTokens, completionTokens);

            if (walletUsd is > 0m)
            {
                await _walletService
                    .QueueOverageSettlementAsync(
                        tenantId,
                        walletUsd.Value,
                        Guid.NewGuid(),
                        pendingReservedUsd ?? 0m,
                        cancellationToken)
                    .ConfigureAwait(false);
            }

            return;
        }

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.IncludedUsdPerUtcMonth < 0.01m || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return;

        if (promptTokens < 1 && completionTokens < 1)
            return;

        decimal? addUsd = _costEstimator.EstimateUsd(promptTokens, completionTokens);

        if (addUsd is null or <= 0m)
            return;

        decimal warnAt = decimal.Round(
            opts.IncludedUsdPerUtcMonth * decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m),
            4,
            MidpointRounding.AwayFromZero);

        try
        {
            string periodKey = await ResolveSettlementPeriodKeyAsync(cancellationToken).ConfigureAwait(false);
            Guid? reservationId = PendingReservationId.Value;

            if (reservationId is null || reservationId == Guid.Empty)
            {
                for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
                {
                    LlmTenantBudgetStateReadModel read =
                        await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                            .ConfigureAwait(false);

                    LlmTenantBudgetSettleResult settled = await _budgetRepository
                        .SettleAsync(
                            new LlmTenantBudgetSettleRequest
                            {
                                TenantId = tenantId,
                                Period = LlmBudgetPeriod.Monthly,
                                PeriodKey = periodKey,
                                ActualUsd = addUsd.Value,
                                ReleaseReservedUsd = pendingReservedUsd ?? 0m,
                                WarnAtUsd = warnAt,
                                ExpectedRowVersion = read.RowVersion
                            },
                            cancellationToken)
                        .ConfigureAwait(false);

                    if (settled.PeriodKeyMismatch)
                        ArchLucidInstrumentation.LlmMonthlyBudgetPeriodRemapTotal.Add(1);

                    if (settled.ConcurrencyConflict)
                    {
                        await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                        continue;
                    }

                    decimal newTotal =
                        settled.NewState?.CommittedUsd ?? throw new InvalidOperationException("Missing spend state after update.");

                    if (settled.ShouldEmitWarnAudit && auditService is not null)
                    {
                        (int year, int month) = ParseUtcYearMonth(periodKey);
                        TryScheduleWarnAudit(scopeProvider, auditService, year, month, newTotal, warnAt, opts);
                    }

                    return;
                }

                ArchLucidInstrumentation.LlmMonthlyBudgetOptimisticRetryExhaustedTotal.Add(1);
                throw new InvalidOperationException("LLM monthly dollar budget could not be updated after optimistic retries.");
            }

            LlmMonthlyTenantBudgetReservationSettleResult settledById = await _reservationStore
                .SettleAsync(reservationId.Value, addUsd.Value, warnAt, cancellationToken)
                .ConfigureAwait(false);

            if (settledById.PeriodKeyMismatch)
                ArchLucidInstrumentation.LlmMonthlyBudgetPeriodRemapTotal.Add(1);

            if (settledById.ConcurrencyConflict)
            {
                ArchLucidInstrumentation.LlmMonthlyBudgetOptimisticRetryExhaustedTotal.Add(1);
                throw new InvalidOperationException("LLM monthly dollar budget reservation could not be settled.");
            }

            if (settledById.NewState is not null && settledById.ShouldEmitWarnAudit && auditService is not null)
            {
                (int year, int month) = ParseUtcYearMonth(periodKey);
                TryScheduleWarnAudit(
                    scopeProvider,
                    auditService,
                    year,
                    month,
                    settledById.NewState.CommittedUsd,
                    warnAt,
                    opts);
            }
        }
        finally
        {
            ReleaseInFlightReservationSlot(tenantId);
            PendingReservationId.Value = null;
            PendingReservationPeriodKey.Value = null;
        }
    }

    /// <summary>Releases a pre-call reservation when no completion usage was recorded (failed provider call).</summary>
    private static void TryScheduleWarnAudit(
        IScopeContextProvider scopeProvider,
        IAuditService auditService,
        int year,
        int month,
        decimal newTotal,
        decimal warnAt,
        LlmMonthlyTenantDollarBudgetOptions opts)
    {
        try
        {
            ScopeContext scope = scopeProvider.GetCurrentScope();
            string monthLabel = string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", year, month);
            string dataJson = JsonSerializer.Serialize(
                new
                {
                    utcMonth = monthLabel,
                    spentUsd = newTotal,
                    warnAtUsd = warnAt,
                    includedUsd = opts.IncludedUsdPerUtcMonth,
                    hardCutoffUsd = opts.HardCutoffUsdPerUtcMonth
                });

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching,
                "llm-monthly-dollar-budget",
                "llm-monthly-dollar-budget",
                dataJson);

            _ = auditService.LogAsync(auditEvent, CancellationToken.None).ContinueWith(
                static t => _ = t.Exception,
                CancellationToken.None,
                TaskContinuationOptions.OnlyOnFaulted,
                TaskScheduler.Default);
        }
        catch
        {
            // Never block completion path on audit scheduling.
        }
    }
    private async Task<string> ResolveAuthoritativeMonthlyPeriodKeyAsync(CancellationToken cancellationToken)
    {
        return await _budgetRepository.GetSqlUtcMonthlyPeriodKeyAsync(cancellationToken).ConfigureAwait(false);
    }
    private async Task<string> ResolveSettlementPeriodKeyAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(PendingReservationPeriodKey.Value))
            return PendingReservationPeriodKey.Value;

        return await ResolveAuthoritativeMonthlyPeriodKeyAsync(cancellationToken).ConfigureAwait(false);
    }
    private static (int Year, int Month) ParseUtcYearMonth(string periodKey)
    {
        string[] parts = periodKey.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length != 2)
            throw new FormatException("Monthly period key must be yyyy-MM.");

        int year = int.Parse(parts[0], CultureInfo.InvariantCulture);
        int month = int.Parse(parts[1], CultureInfo.InvariantCulture);

        return (year, month);
    }
    private static DateTimeOffset FirstInstantOfNextUtcMonth(int year, int month)
    {
        DateTime firstNext = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        return new DateTimeOffset(firstNext, TimeSpan.Zero);
    }
}
