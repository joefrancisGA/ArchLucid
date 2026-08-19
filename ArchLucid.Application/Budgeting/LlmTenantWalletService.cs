using System.Globalization;
using System.Text.Json;
using System.Threading.Channels;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
    private const int MaxOptimisticRetries = 12;

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<LlmTenantWalletService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

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

        LlmTenantWalletStateReadModel state = await _repository.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (state.BalanceUsd + 0.0001m < estimatedUsd)
            return false;

        return true;
    }

    public Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty || actualUsd <= 0m)
            return Task.CompletedTask;

        _settlementQueue.EnqueueConsume(tenantId, actualUsd, correlationId);

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
            await LogRefillFailedAsync(tenantId, charge.DeclineCode, charge.ErrorMessage, cancellationToken).ConfigureAwait(false);

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
        await LogRefillSucceededAsync(tenantId, charge.PaymentIntentId, state.RefillIncrementUsd, cancellationToken).ConfigureAwait(false);

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

    internal async Task ConsumeInternalAsync(
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
                return;

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
            }

            return;
        }
    }

    private async Task<LlmTenantWalletCreditResult> CreditRefillWithRetryAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string paymentIntentId,
        CancellationToken cancellationToken)
    {
        int utcYearMonth = GetUtcYearMonth();

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
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

    private static bool CanAutoRefill(LlmTenantWalletStateReadModel state)
    {
        if (!state.AutoReplenishEnabled)
            return false;

        if (state.MonthlyCapUsd <= 0m)
            return false;

        if (state.BalanceUsd >= state.RefillTriggerThresholdUsd)
            return false;

        decimal spentThisMonth = state.AutoRefillsThisUtcMonthCount * state.RefillIncrementUsd;

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

    private async Task LogRefillSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        CancellationToken cancellationToken)
    {
        string dataJson = JsonSerializer.Serialize(new { paymentIntentId, amountUsd });

        await LogRefillAuditAsync(
                new AuditEvent
                {
                    TenantId = tenantId,
                    EventType = AuditEventTypes.LlmWalletRefillSucceeded,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    ExplicitActor = true,
                    DataJson = dataJson,
                    OccurredUtc = _timeProvider.GetUtcNow().UtcDateTime,
                },
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task LogRefillFailedAsync(
        Guid tenantId,
        string? declineCode,
        string? errorMessage,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordLlmWalletRefillFailure(declineCode);

        string dataJson = JsonSerializer.Serialize(new { declineCode, errorMessage });

        await LogRefillAuditAsync(
                new AuditEvent
                {
                    TenantId = tenantId,
                    EventType = AuditEventTypes.LlmWalletRefillFailed,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    ExplicitActor = true,
                    DataJson = dataJson,
                    OccurredUtc = _timeProvider.GetUtcNow().UtcDateTime,
                },
                cancellationToken)
            .ConfigureAwait(false);
    }

    [InformationalAudit]
    private Task LogRefillAuditAsync(AuditEvent auditEvent, CancellationToken cancellationToken) =>
        _auditService.LogAsync(auditEvent, cancellationToken);

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

public sealed class LlmWalletSettlementQueue : ILlmWalletSettlementQueue
{
    private readonly Channel<LlmWalletSettlementWorkItem> _channel =
        Channel.CreateUnbounded<LlmWalletSettlementWorkItem>(new UnboundedChannelOptions { SingleReader = true });

    internal ChannelReader<LlmWalletSettlementWorkItem> Reader => _channel.Reader;

    public void EnqueueConsume(Guid tenantId, decimal amountUsd, Guid correlationId)
    {
        _channel.Writer.TryWrite(new LlmWalletSettlementWorkItem(LlmWalletSettlementKind.Consume, tenantId, amountUsd, correlationId));
    }

    public void EnqueueAutoRefill(Guid tenantId, Guid correlationId)
    {
        _channel.Writer.TryWrite(new LlmWalletSettlementWorkItem(LlmWalletSettlementKind.AutoRefill, tenantId, 0m, correlationId));
    }
}

internal enum LlmWalletSettlementKind
{
    Consume = 0,
    AutoRefill = 1,
}

internal readonly record struct LlmWalletSettlementWorkItem(
    LlmWalletSettlementKind Kind,
    Guid TenantId,
    decimal AmountUsd,
    Guid CorrelationId);

public sealed class LlmWalletSettlementHostedService(
    LlmWalletSettlementQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<LlmWalletSettlementHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (LlmWalletSettlementWorkItem item in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
                LlmTenantWalletService walletService = scope.ServiceProvider.GetRequiredService<LlmTenantWalletService>();

                if (item.Kind == LlmWalletSettlementKind.Consume)
                {
                    await walletService
                        .ConsumeInternalAsync(item.TenantId, item.AmountUsd, item.CorrelationId, stoppingToken)
                        .ConfigureAwait(false);
                }
                else
                {
                    await walletService.TryAutoRefillAsync(item.TenantId, item.CorrelationId, stoppingToken).ConfigureAwait(false);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(
                    ex,
                    "LLM wallet settlement failed for tenant {TenantId} kind {Kind}.",
                    item.TenantId,
                    item.Kind);
            }
        }
    }
}
