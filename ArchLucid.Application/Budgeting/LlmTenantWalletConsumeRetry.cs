using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting;

internal sealed class LlmTenantWalletConsumeRetry(
    ILlmTenantWalletRepository repository,
    ILlmWalletSettlementQueue settlementQueue,
    ILogger logger)
{
    internal const int MaxOptimisticRetries = 12;

    private readonly ILogger _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ILlmTenantWalletRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ILlmWalletSettlementQueue _settlementQueue =
        settlementQueue ?? throw new ArgumentNullException(nameof(settlementQueue));

    internal async Task ConsumeInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken)
    {
        bool consumed = await TryConsumeWithRetryAsync(tenantId, amountUsd, correlationId, cancellationToken).ConfigureAwait(false);

        if (!consumed)
        {
            _logger.LogWarning(
                "LLM wallet consume exhausted optimistic retries for tenant {TenantId}; re-queuing settlement for {AmountUsd} USD.",
                tenantId,
                amountUsd);

            _settlementQueue.EnqueueConsume(tenantId, amountUsd, correlationId);
        }
    }

    internal async Task ReconcileOverageInternalAsync(
        Guid tenantId,
        decimal actualUsd,
        decimal authorizedUsd,
        Guid correlationId,
        CancellationToken cancellationToken)
    {
        decimal delta = decimal.Round(actualUsd - authorizedUsd, 2, MidpointRounding.AwayFromZero);

        if (delta > 0m)
        {
            bool consumed = await TryConsumeWithRetryAsync(tenantId, delta, correlationId, cancellationToken).ConfigureAwait(false);

            if (!consumed)
            {
                _logger.LogWarning(
                    "LLM wallet overage reconciliation delta consume failed for tenant {TenantId}; re-queuing settlement for actual {ActualUsd} USD (authorized {AuthorizedUsd} USD).",
                    tenantId,
                    actualUsd,
                    authorizedUsd);

                _settlementQueue.EnqueueConsume(tenantId, actualUsd, correlationId, authorizedUsd);
            }

            return;
        }

        if (delta < 0m)
        {
            bool credited = await CreditAdjustmentInternalAsync(tenantId, -delta, correlationId, cancellationToken).ConfigureAwait(false);

            if (!credited)
            {
                _logger.LogWarning(
                    "LLM wallet overage reconciliation credit failed for tenant {TenantId}; re-queuing settlement for actual {ActualUsd} USD (authorized {AuthorizedUsd} USD).",
                    tenantId,
                    actualUsd,
                    authorizedUsd);

                _settlementQueue.EnqueueConsume(tenantId, actualUsd, correlationId, authorizedUsd);
            }
        }
    }

    internal async Task<bool> TryConsumeWithRetryAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            LlmTenantWalletConsumeResult result = await _repository
                .TryConsumeAsync(tenantId, amountUsd, correlationId, state.RowVersion, cancellationToken)
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
                    _settlementQueue.EnqueueAutoRefill(tenantId, correlationId);

                return true;
            }
        }

        return false;
    }

    internal async Task<bool> CreditAdjustmentInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

            LlmTenantWalletCreditResult credit = await _repository
                .TryCreditAdjustmentAsync(tenantId, amountUsd, correlationId, state.RowVersion, cancellationToken)
                .ConfigureAwait(false);

            if (credit.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (credit.Succeeded)
            {
                RecordBalanceGauge(tenantId, credit.BalanceAfterUsd);

                return true;
            }

            return false;
        }

        _logger.LogWarning(
            "LLM wallet settlement credit exhausted optimistic retries for tenant {TenantId}; amount {AmountUsd} USD was not credited.",
            tenantId,
            amountUsd);

        return false;
    }

    private static void RecordBalanceGauge(Guid tenantId, decimal balanceUsd)
    {
        ArchLucidInstrumentation.RecordLlmWalletBalanceUsd(tenantId, balanceUsd);
    }
}
