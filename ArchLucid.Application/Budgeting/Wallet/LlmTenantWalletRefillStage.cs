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
    ILogger<LlmTenantWalletRefillStage> logger) : ILlmTenantWalletRefillStage
{
    private readonly LlmTenantWalletRefillAuditor _refillAuditor = new(auditService, timeProvider);

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IStripeWalletGateway _stripeWalletGateway =
        stripeWalletGateway ?? throw new ArgumentNullException(nameof(stripeWalletGateway));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<LlmTenantWalletRefillStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            return false;

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
            cancellationToken).ConfigureAwait(false);

        if (!credit.Succeeded)
            return false;

        ArchLucidInstrumentation.RecordLlmWalletRefillUsd(state.RefillIncrementUsd);
        RecordBalanceGauge(tenantId, credit.BalanceAfterUsd);
        await _refillAuditor.LogRefillSucceededAsync(tenantId, charge.PaymentIntentId, state.RefillIncrementUsd, cancellationToken).ConfigureAwait(false);

        return true;
    }

    public async Task<LlmTenantWalletCreditResult> CreditRefillWithRetryAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string paymentIntentId,
        CancellationToken cancellationToken)
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

    private bool CanAutoRefill(LlmTenantWalletStateReadModel state)
    {
        if (!state.AutoReplenishEnabled)
            return false;

        if (state.MonthlyCapUsd <= 0m)
            return false;

        if (state.BalanceUsd >= state.RefillTriggerThresholdUsd)
            return false;

        int utcYearMonth = GetUtcYearMonth();
        int monthRefillCount = state.AutoRefillsThisUtcMonthYearMonth == utcYearMonth
            ? state.AutoRefillsThisUtcMonthCount
            : 0;

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
