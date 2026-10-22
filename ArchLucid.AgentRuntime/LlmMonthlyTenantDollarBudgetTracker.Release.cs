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
    public async Task ReleasePendingReservationIfAnyAsync(
        Guid tenantId,
        string providerKind,
        decimal? pending,
        bool overageActive,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return;

        if (pending is null or <= 0m)
            return;

        if (overageActive)
            return;

        decimal warnAt = decimal.Round(
            opts.IncludedUsdPerUtcMonth * decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m),
            4,
            MidpointRounding.AwayFromZero);

        try
        {
            Guid? reservationId = PendingReservationId.Value;

            if (reservationId is not null && reservationId != Guid.Empty)
            {
                await _reservationStore.ReleaseAsync(reservationId.Value, cancellationToken).ConfigureAwait(false);

                return;
            }

            string periodKey = await ResolveSettlementPeriodKeyAsync(cancellationToken).ConfigureAwait(false);

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
                            ActualUsd = 0m,
                            ReleaseReservedUsd = pending.Value,
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

                return;
            }

            ArchLucidInstrumentation.LlmMonthlyBudgetOptimisticRetryExhaustedTotal.Add(1);
            throw new InvalidOperationException(
                "LLM monthly dollar budget reservation could not be released after optimistic retries.");
        }
        finally
        {
            ReleaseInFlightReservationSlot(tenantId);
            PendingReservationId.Value = null;
            PendingReservationPeriodKey.Value = null;
        }
    }

    [InformationalAudit]
    private LlmTokenQuotaExceededException CreateHardCapExceededException(
        decimal effectiveMax,
        decimal totalPressure,
        string periodKey)
    {
        (int year, int month) = ParseUtcYearMonth(periodKey);
        DateTimeOffset retryAfterUtc = FirstInstantOfNextUtcMonth(year, month);

        return new LlmTokenQuotaExceededException(
            string.Format(
                CultureInfo.InvariantCulture,
                "LLM monthly dollar budget exceeded for tenant (UTC month hard cap {0:C}, used ~{1:C}).",
                effectiveMax,
                totalPressure),
            retryAfterUtc);
    }
    private LlmTokenQuotaExceededException CreateAdmissionBlockedException(Guid tenantId)
    {
        DateTimeOffset retryAfterUtc = _timeProvider.GetUtcNow().AddSeconds(30);

        return new LlmTokenQuotaExceededException(
            string.Format(
                CultureInfo.InvariantCulture,
                "LLM monthly dollar budget admission temporarily limited for tenant {0} (too many concurrent in-flight reservations).",
                tenantId),
            retryAfterUtc);
    }
    private bool ShouldSimulateBudgetExhausted()
    {
        return _configuration.GetValue<bool>("ArchLucid:Testing:SimulateLlmBudgetExhausted")
               && !_hostEnvironment.IsProduction();
    }
    private LlmTokenQuotaExceededException CreateSimulatedBudgetExhaustedException()
    {
        DateTimeOffset retryAfterUtc = _timeProvider.GetUtcNow().AddHours(1);
        return new LlmTokenQuotaExceededException("Simulated LLM budget exhaustion.", retryAfterUtc);
    }
}
