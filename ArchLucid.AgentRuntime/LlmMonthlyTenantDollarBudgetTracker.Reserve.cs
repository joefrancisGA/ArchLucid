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
    public async Task<(decimal? ReservedUsd, bool OverageActive)> EnsureWithinBudgetBeforeCallAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return (null, false);

        if (ShouldSimulateBudgetExhausted())
            throw CreateSimulatedBudgetExhaustedException();

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return (null, false);

        int assumedPrompt = Math.Clamp(opts.AssumedMaxPromptTokensPerRequest, 1, 1_000_000);
        int assumedCompletion = Math.Clamp(opts.AssumedMaxCompletionTokensPerRequest, 1, 262_144);
        decimal? assumedUsd = _costEstimator.EstimateUsd(assumedPrompt, assumedCompletion);
        decimal assumed = assumedUsd ?? 0m;

        if (assumed <= 0m)
            return (null, false);

        if (!TryAcquireInFlightReservationSlot(tenantId, opts.MaxConcurrentInFlightMonthlyReservations))
        {
            ArchLucidInstrumentation.LlmMonthlyBudgetAdmissionBlockedTotal.Add(1);
            throw CreateAdmissionBlockedException(tenantId);
        }

        bool inFlightHeld = true;

        try
        {
            string periodKey = await ResolveAuthoritativeMonthlyPeriodKeyAsync(cancellationToken).ConfigureAwait(false);
            decimal? resolvedCap = await _budgetCapResolver.ResolveHardCapUsdAsync(tenantId, cancellationToken).ConfigureAwait(false);
            decimal max = resolvedCap ?? opts.HardCutoffUsdPerUtcMonth;

            LlmTenantBudgetStateReadModel state =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            decimal effectiveMax = max + state.PurchasedCapBumpUsd;

            if (state.TotalUsdPressure + assumed > effectiveMax)
            {
                bool walletAllowed = await _budgetCapResolver.IsWalletOverageAllowedAsync(tenantId, cancellationToken)
                    .ConfigureAwait(false);

                if (walletAllowed &&
                    await _walletService.TryAuthorizeOverageSpendAsync(tenantId, assumed, cancellationToken).ConfigureAwait(false))
                {
                    ReleaseInFlightReservationSlot(tenantId);
                    inFlightHeld = false;

                    return (assumed, true);
                }

                throw CreateHardCapExceededException(effectiveMax, state.TotalUsdPressure, periodKey);
            }

            for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
            {
                state =
                    await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                        .ConfigureAwait(false);

                effectiveMax = max + state.PurchasedCapBumpUsd;

                Guid reservationId = Guid.NewGuid();
                TimeSpan reservationTtl = TimeSpan.FromMinutes(Math.Clamp(opts.ReservationTtlMinutes, 1, 24 * 60));

                LlmMonthlyTenantBudgetReservationStoreResult reserved = await _reservationStore
                    .TryReserveAsync(
                        new LlmMonthlyTenantBudgetReservationRequest
                        {
                            ReservationId = reservationId,
                            TenantId = tenantId,
                            PeriodKey = periodKey,
                            ReserveUsd = assumed,
                            HardCapUsd = effectiveMax,
                            ExpectedRowVersion = state.RowVersion,
                            UtcNow = _timeProvider.GetUtcNow(),
                            ReservationTtl = reservationTtl
                        },
                        cancellationToken)
                    .ConfigureAwait(false);

                if (reserved.PeriodKeyMismatch && !string.IsNullOrWhiteSpace(reserved.AuthoritativePeriodKey))
                {
                    ArchLucidInstrumentation.LlmMonthlyBudgetPeriodRemapTotal.Add(1);
                    periodKey = reserved.AuthoritativePeriodKey;
                }

                if (reserved.ConcurrencyConflict)
                {
                    await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                    continue;
                }

                if (reserved.HardCapBlocked)
                {
                    bool walletAllowed = await _budgetCapResolver.IsWalletOverageAllowedAsync(tenantId, cancellationToken)
                        .ConfigureAwait(false);

                    if (walletAllowed &&
                        await _walletService.TryAuthorizeOverageSpendAsync(tenantId, assumed, cancellationToken).ConfigureAwait(false))
                    {
                        ReleaseInFlightReservationSlot(tenantId);
                        inFlightHeld = false;

                        return (assumed, true);
                    }

                    LlmTenantBudgetStateReadModel blocked = reserved.NewState ?? state;
                    throw CreateHardCapExceededException(max + blocked.PurchasedCapBumpUsd, blocked.TotalUsdPressure, periodKey);
                }

                if (!reserved.Allowed || reserved.ReservationId is null)
                {
                    await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                    continue;
                }

                PendingReservationId.Value = reserved.ReservationId;
                PendingReservationPeriodKey.Value = periodKey;

                return (assumed, false);
            }

            ArchLucidInstrumentation.LlmMonthlyBudgetOptimisticRetryExhaustedTotal.Add(1);
            throw new InvalidOperationException("LLM monthly dollar budget reserve could not complete after optimistic retries.");
        }
        finally
        {
            if (inFlightHeld && PendingReservationId.Value is null)
                ReleaseInFlightReservationSlot(tenantId);
        }
    }

    /// <summary>Accumulates estimated USD and fires the once-per-UTC-month warning audit when crossing the warn threshold.</summary>
    private static bool TryAcquireInFlightReservationSlot(Guid tenantId, int maxConcurrent)
    {
        if (maxConcurrent < 1)
            return true;

        while (true)
        {
            int current = InFlightReservationsByTenant.GetOrAdd(tenantId, 0);

            if (current >= maxConcurrent)
                return false;

            if (InFlightReservationsByTenant.TryUpdate(tenantId, current + 1, current))
                return true;
        }
    }
    private static void ReleaseInFlightReservationSlot(Guid tenantId)
    {
        while (true)
        {
            int current = InFlightReservationsByTenant.GetOrAdd(tenantId, 0);

            if (current <= 0)
                return;

            if (InFlightReservationsByTenant.TryUpdate(tenantId, current - 1, current))
                return;
        }
    }
}
