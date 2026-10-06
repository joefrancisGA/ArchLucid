using System.Collections.Concurrent;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting.Wallet;

/// <inheritdoc cref="ILlmTenantWalletRefillStage" />
public sealed class LlmTenantWalletRefillStage(
    ILlmTenantWalletRepository repository,
    IStripeWalletGateway stripeWalletGateway,
    IAuditService auditService,
    TimeProvider timeProvider,
    ILlmWalletSettlementQueue settlementQueue,
    ILogger<LlmTenantWalletRefillStage> logger) : ILlmTenantWalletRefillStage
{
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> AutoRefillTenantGates = new();

    private static readonly ConcurrentDictionary<Guid, PendingStripeRefillCredit> PendingRefillCredits = new();

    private readonly LlmTenantWalletRefillAuditor _refillAuditor = new(auditService, timeProvider);

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IStripeWalletGateway _stripeWalletGateway =
        stripeWalletGateway ?? throw new ArgumentNullException(nameof(stripeWalletGateway));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<LlmTenantWalletRefillStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ILlmWalletSettlementQueue _settlementQueue =
        settlementQueue ?? throw new ArgumentNullException(nameof(settlementQueue));

    private sealed record PendingStripeRefillCredit(string PaymentIntentId, decimal AmountUsd, Guid CorrelationId);

    public async Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            return false;

        SemaphoreSlim gate = AutoRefillTenantGates.GetOrAdd(tenantId, static _ => new SemaphoreSlim(1, 1));

        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            if (PendingRefillCredits.TryGetValue(tenantId, out PendingStripeRefillCredit? pending))
            {
                LlmTenantWalletCreditResult pendingCredit = await CreditRefillWithRetryAsync(
                    tenantId,
                    pending.AmountUsd,
                    pending.CorrelationId,
                    pending.PaymentIntentId,
                    cancellationToken: cancellationToken).ConfigureAwait(false);

                return await FinalizeRefillCreditAsync(
                    tenantId,
                    pending.AmountUsd,
                    pending.CorrelationId,
                    pending.PaymentIntentId,
                    pendingCredit,
                    cancellationToken).ConfigureAwait(false);
            }

            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            if (!CanAutoRefill(state))
                return false;

            if (string.IsNullOrWhiteSpace(state.StripeCustomerId) || string.IsNullOrWhiteSpace(state.StripePaymentMethodId))
                return false;

            StripeWalletChargeResult charge = await _stripeWalletGateway
                .ChargeRefillAsync(
                    tenantId,
                    state.StripeCustomerId,
                    state.StripePaymentMethodId,
                    state.RefillIncrementUsd,
                    correlationId,
                    cancellationToken)
                .ConfigureAwait(false);

            if (!charge.Succeeded || string.IsNullOrWhiteSpace(charge.PaymentIntentId))
            {
                await _refillAuditor.LogRefillFailedAsync(tenantId, charge.DeclineCode, charge.ErrorMessage, cancellationToken).ConfigureAwait(false);

                return false;
            }

            LlmTenantWalletCreditResult credit = await CreditRefillWithRetryAsync(
                tenantId,
                state.RefillIncrementUsd,
                correlationId,
                charge.PaymentIntentId,
                cancellationToken: cancellationToken).ConfigureAwait(false);

            return await FinalizeRefillCreditAsync(
                tenantId,
                state.RefillIncrementUsd,
                correlationId,
                charge.PaymentIntentId,
                credit,
                cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            gate.Release();
        }
    }

    public async Task<LlmTenantWalletCreditResult> CreditRefillWithRetryAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string paymentIntentId,
        bool incrementMonthlyAutoRefillCount = true,
        CancellationToken cancellationToken = default)
    {
        int utcYearMonth = GetUtcYearMonth();

        for (int attempt = 0; attempt < LlmTenantWalletConsumeRetry.MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            LlmTenantWalletCreditResult credit = await _repository
                .TryCreditRefillAsync(
                    tenantId,
                    amountUsd,
                    correlationId,
                    paymentIntentId,
                    utcYearMonth,
                    state.RowVersion,
                    incrementMonthlyAutoRefillCount,
                    cancellationToken)
                .ConfigureAwait(false);

            if (credit.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            return credit;
        }

        _logger.LogWarning(
            "LLM wallet refill credit exhausted optimistic retries for tenant {TenantId}; amount {AmountUsd} USD was not credited.",
            tenantId,
            amountUsd);

        return LlmTenantWalletCreditResult.Conflict();
    }

    public int VisibleAutoRefillsThisUtcMonth(LlmTenantWalletStateReadModel state)
    {
        ArgumentNullException.ThrowIfNull(state);

        int utcYearMonth = GetUtcYearMonth();

        if (state.AutoRefillsThisUtcMonthYearMonth != utcYearMonth)
        {
            return 0;
        }

        return state.AutoRefillsThisUtcMonthCount;
    }

    public async Task EnqueueAutoRefillIfBalanceBelowTriggerAsync(
        Guid tenantId,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            return;

        LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (state.BalanceUsd < state.RefillTriggerThresholdUsd)
            _settlementQueue.EnqueueAutoRefill(tenantId, correlationId);
    }

    private async Task<bool> FinalizeRefillCreditAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string paymentIntentId,
        LlmTenantWalletCreditResult credit,
        CancellationToken cancellationToken)
    {
        if (!credit.Succeeded)
        {
            if (credit.DuplicatePaymentIntent)
            {
                PendingRefillCredits.TryRemove(tenantId, out _);

                return true;
            }

            PendingRefillCredits[tenantId] = new(paymentIntentId, amountUsd, correlationId);
            _settlementQueue.EnqueueRefillCredit(tenantId, amountUsd, correlationId, paymentIntentId);

            _logger.LogWarning(
                "LLM wallet refill credit pending for tenant {TenantId}; queued credit retry for payment intent {PaymentIntentId}.",
                tenantId,
                paymentIntentId);

            return false;
        }

        PendingRefillCredits.TryRemove(tenantId, out _);
        ArchLucidInstrumentation.RecordLlmWalletRefillUsd(amountUsd);
        RecordBalanceGauge(tenantId, credit.BalanceAfterUsd);
        await _refillAuditor.LogRefillSucceededAsync(tenantId, paymentIntentId, amountUsd, cancellationToken).ConfigureAwait(false);

        return true;
    }

    private bool CanAutoRefill(LlmTenantWalletStateReadModel state)
    {
        if (!state.AutoReplenishEnabled)
            return false;

        if (state.MonthlyCapUsd <= 0m)
            return false;

        if (state.BalanceUsd >= state.RefillTriggerThresholdUsd)
            return false;

        int monthRefillCount = VisibleAutoRefillsThisUtcMonth(state);

        decimal spentThisMonth = monthRefillCount * state.RefillIncrementUsd;

        return spentThisMonth + state.RefillIncrementUsd <= state.MonthlyCapUsd + 0.0001m;
    }

    private int GetUtcYearMonth()
    {
        DateTime utc = _timeProvider.GetUtcNow().UtcDateTime;

        return utc.Year * 100 + utc.Month;
    }

    private static void RecordBalanceGauge(Guid tenantId, decimal balanceUsd)
    {
        ArchLucidInstrumentation.RecordLlmWalletBalanceUsd(tenantId, balanceUsd);
    }
}
