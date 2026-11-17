using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting.Wallet;

/// <inheritdoc cref="ILlmTenantWalletConsumeStage" />
public sealed class LlmTenantWalletConsumeStage(
    ILlmTenantWalletRepository repository,
    ILlmWalletSettlementQueue settlementQueue,
    IStripeWalletPaymentIdentifierGuard stripeWalletPaymentIdentifierGuard,
    IStripeLinkedCustomerResolver stripeLinkedCustomerResolver,
    ILogger<LlmTenantWalletConsumeStage> logger) : ILlmTenantWalletConsumeStage
{
    private readonly LlmTenantWalletConsumeRetry _consumeRetry = new(repository, settlementQueue, logger);

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ILlmWalletSettlementQueue _settlementQueue =
        settlementQueue ?? throw new ArgumentNullException(nameof(settlementQueue));

    private readonly IStripeWalletPaymentIdentifierGuard _stripeWalletPaymentIdentifierGuard =
        stripeWalletPaymentIdentifierGuard ?? throw new ArgumentNullException(nameof(stripeWalletPaymentIdentifierGuard));

    private readonly IStripeLinkedCustomerResolver _stripeLinkedCustomerResolver =
        stripeLinkedCustomerResolver ?? throw new ArgumentNullException(nameof(stripeLinkedCustomerResolver));

    public Task<LlmTenantWalletStateReadModel> GetOrCreateAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        _repository.GetOrCreateAsync(tenantId, cancellationToken);

    public async Task<LlmTenantWalletStateReadModel?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (command.MonthlyCapUsd.HasValue && !IsValidMonthlyCap(command.MonthlyCapUsd.Value))
            return null;

        LlmTenantWalletStateReadModel? walletStateForEnableValidation = null;

        if (command.AutoReplenishEnabled == true)
        {
            if (command.MonthlyCapUsd is <= 0m)
                return null;

            if (!command.MonthlyCapUsd.HasValue)
            {
                walletStateForEnableValidation = await _repository
                    .GetOrCreateAsync(tenantId, cancellationToken)
                    .ConfigureAwait(false);

                if (walletStateForEnableValidation.MonthlyCapUsd <= 0m
                    || !IsValidMonthlyCap(walletStateForEnableValidation.MonthlyCapUsd))
                    return null;
            }
        }

        string? normalizedStripeCustomerId = NormalizeOptionalStripeId(command.StripeCustomerId);
        string? normalizedStripePaymentMethodId = NormalizeOptionalStripeId(command.StripePaymentMethodId);

        if (!await _stripeWalletPaymentIdentifierGuard
                .AllowsWalletUpdateAsync(
                    tenantId,
                    normalizedStripeCustomerId,
                    normalizedStripePaymentMethodId,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            return null;
        }

        if (normalizedStripePaymentMethodId is not null && normalizedStripeCustomerId is null)
        {
            string? linkedCustomerId = await _stripeLinkedCustomerResolver
                .TryResolveLinkedCustomerIdAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(linkedCustomerId))
                normalizedStripeCustomerId = linkedCustomerId;
        }

        if (command.AutoReplenishEnabled == true)
        {
            walletStateForEnableValidation ??= await _repository
                .GetOrCreateAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            string? effectiveCustomerId = normalizedStripeCustomerId
                ?? NormalizeOptionalStripeId(walletStateForEnableValidation.StripeCustomerId);
            string? effectivePaymentMethodId = normalizedStripePaymentMethodId
                ?? NormalizeOptionalStripeId(walletStateForEnableValidation.StripePaymentMethodId);

            if (string.IsNullOrWhiteSpace(effectiveCustomerId) || string.IsNullOrWhiteSpace(effectivePaymentMethodId))
                return null;

            if (!await _stripeWalletPaymentIdentifierGuard
                    .AllowsWalletUpdateAsync(
                        tenantId,
                        effectiveCustomerId,
                        effectivePaymentMethodId,
                        cancellationToken)
                    .ConfigureAwait(false))
            {
                return null;
            }
        }

        LlmTenantWalletStateReadModel? updated = await _repository
            .UpdateSettingsAsync(
                new LlmTenantWalletUpdateSettingsRequest
                {
                    TenantId = tenantId,
                    AutoReplenishEnabled = command.AutoReplenishEnabled,
                    MonthlyCapUsd = command.MonthlyCapUsd,
                    StripeCustomerId = normalizedStripeCustomerId,
                    StripePaymentMethodId = normalizedStripePaymentMethodId,
                    ExpectedRowVersion = command.ExpectedRowVersion,
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (updated is not null)
            RecordBalanceGauge(tenantId, updated.BalanceUsd);

        return updated;
    }

    public async Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || estimatedUsd <= 0m)
            return false;

        decimal billedUsd = LlmTenantWalletDefaults.ApplyOverageMarkup(estimatedUsd);

        for (int attempt = 0; attempt < LlmTenantWalletConsumeRetry.MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            LlmTenantWalletConsumeResult result = await _repository
                .TryConsumeAsync(tenantId, billedUsd, Guid.NewGuid(), state.RowVersion, cancellationToken)
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

                if (result.BalanceAfterUsd < state.RefillTriggerThresholdUsd)
                    _settlementQueue.EnqueueAutoRefill(tenantId, Guid.NewGuid());

                return true;
            }
        }

        return false;
    }

    public Task ConsumeInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeRetry.ConsumeInternalAsync(tenantId, amountUsd, correlationId, cancellationToken);

    public Task ReconcileOverageInternalAsync(
        Guid tenantId,
        decimal actualUsd,
        decimal authorizedUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeRetry.ReconcileOverageInternalAsync(tenantId, actualUsd, authorizedUsd, correlationId, cancellationToken);

    private static bool IsValidMonthlyCap(decimal capUsd)
    {
        if (capUsd < 0m || capUsd > LlmTenantWalletDefaults.MaxMonthlyAutoReplenishCapUsd)
            return false;

        if (capUsd == 0m)
            return true;

        decimal remainder = capUsd % LlmTenantWalletDefaults.MonthlyCapStepUsd;

        return remainder == 0m;
    }

    private static void RecordBalanceGauge(Guid tenantId, decimal balanceUsd)
    {
        ArchLucidInstrumentation.RecordLlmWalletBalanceUsd(tenantId, balanceUsd);
    }

    // Partial wallet PUT omits unset fields as null; clients that send "" for an omitted Stripe id
    // must not clear persisted identifiers (COALESCE/in-memory updates treat empty string as a value).
    private static string? NormalizeOptionalStripeId(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
