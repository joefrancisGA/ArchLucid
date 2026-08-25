using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmTenantWalletService(
    ILlmTenantWalletRepository repository,
    IStripeWalletGateway stripeWalletGateway,
    ILlmWalletSettlementQueue settlementQueue,
    IAuditService auditService,
    TimeProvider timeProvider,
    ILogger<LlmTenantWalletService> logger) : ILlmTenantWalletService
{
    private readonly LlmTenantWalletConsumeRetry _consumeRetry = new(repository, settlementQueue, logger);

    private readonly LlmTenantWalletRefillAuditor _refillAuditor = new(auditService, timeProvider);

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ILlmWalletSettlementQueue _settlementQueue =
        settlementQueue ?? throw new ArgumentNullException(nameof(settlementQueue));

    private readonly IStripeWalletGateway _stripeWalletGateway =
        stripeWalletGateway ?? throw new ArgumentNullException(nameof(stripeWalletGateway));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<LlmTenantWalletView> GetWalletAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);
        RecordBalanceGauge(tenantId, state.BalanceUsd);

        return MapView(state);
    }

    public async Task<LlmTenantWalletView?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (command.MonthlyCapUsd.HasValue && !IsValidMonthlyCap(command.MonthlyCapUsd.Value))
            return null;

        if (command.AutoReplenishEnabled == true
            && command.MonthlyCapUsd.GetValueOrDefault() <= 0m)
        {
            return null;
        }

        LlmTenantWalletStateReadModel? updated = await _repository
            .UpdateSettingsAsync(
                new LlmTenantWalletUpdateSettingsRequest
                {
                    TenantId = tenantId,
                    AutoReplenishEnabled = command.AutoReplenishEnabled,
                    MonthlyCapUsd = command.MonthlyCapUsd,
                    StripeCustomerId = command.StripeCustomerId,
                    StripePaymentMethodId = command.StripePaymentMethodId,
                    ExpectedRowVersion = command.ExpectedRowVersion,
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (updated is null)
            return null;

        RecordBalanceGauge(tenantId, updated.BalanceUsd);

        return MapView(updated);
    }

    public async Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || estimatedUsd <= 0m)
            return false;

        for (int attempt = 0; attempt < LlmTenantWalletConsumeRetry.MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            LlmTenantWalletConsumeResult result = await _repository
                .TryConsumeAsync(tenantId, estimatedUsd, Guid.NewGuid(), state.RowVersion, cancellationToken)
                .ConfigureAwait(false);

            if (result.InsufficientFunds)
                return false;

            if (result.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (result.Succeeded)
            {
                RecordBalanceGauge(tenantId, result.BalanceAfterUsd);

                return true;
            }
        }

        return false;
    }

    public Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        decimal authorizedUsd = 0m,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty || actualUsd <= 0m)
            return Task.CompletedTask;

        _settlementQueue.EnqueueConsume(tenantId, actualUsd, correlationId, authorizedUsd);

        return Task.CompletedTask;
    }

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

    public async Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || string.IsNullOrWhiteSpace(paymentIntentId) || amountUsd <= 0m)
            return false;

        LlmTenantWalletCreditResult credit = await CreditRefillWithRetryAsync(
            tenantId,
            amountUsd,
            correlationId,
            paymentIntentId,
            cancellationToken).ConfigureAwait(false);

        if (!credit.Succeeded)
            return credit.DuplicatePaymentIntent;

        ArchLucidInstrumentation.RecordLlmWalletRefillUsd(amountUsd);
        RecordBalanceGauge(tenantId, credit.BalanceAfterUsd);

        return true;
    }

    internal Task ConsumeInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeRetry.ConsumeInternalAsync(tenantId, amountUsd, correlationId, cancellationToken);

    internal Task ReconcileOverageInternalAsync(
        Guid tenantId,
        decimal actualUsd,
        decimal authorizedUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeRetry.ReconcileOverageInternalAsync(tenantId, actualUsd, authorizedUsd, correlationId, cancellationToken);

    private async Task<LlmTenantWalletCreditResult> CreditRefillWithRetryAsync(
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

    private static bool IsValidMonthlyCap(decimal capUsd)
    {
        if (capUsd < 0m || capUsd > LlmTenantWalletDefaults.MaxMonthlyAutoReplenishCapUsd)
            return false;

        if (capUsd == 0m)
            return true;

        decimal remainder = capUsd % LlmTenantWalletDefaults.MonthlyCapStepUsd;

        return remainder == 0m;
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

    private static LlmTenantWalletView MapView(LlmTenantWalletStateReadModel state)
    {
        return new LlmTenantWalletView
        {
            BalanceUsd = state.BalanceUsd,
            AutoReplenishEnabled = state.AutoReplenishEnabled,
            MonthlyCapUsd = state.MonthlyCapUsd,
            RefillIncrementUsd = state.RefillIncrementUsd,
            RefillTriggerThresholdUsd = state.RefillTriggerThresholdUsd,
            AutoRefillsThisUtcMonthCount = state.AutoRefillsThisUtcMonthCount,
            LastRefillUtc = state.LastRefillUtc,
            HasPaymentMethod = !string.IsNullOrWhiteSpace(state.StripePaymentMethodId),
            RowVersion = state.RowVersion,
        };
    }
}
