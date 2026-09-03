using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting.Wallet;

/// <inheritdoc cref="ILlmTenantWalletConsumeStage" />
public sealed class LlmTenantWalletConsumeStage(
    ILlmTenantWalletRepository repository,
    ILlmWalletSettlementQueue settlementQueue,
    ILogger<LlmTenantWalletConsumeStage> logger) : ILlmTenantWalletConsumeStage
{
    private readonly LlmTenantWalletConsumeRetry _consumeRetry = new(repository, settlementQueue, logger);

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

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
}
