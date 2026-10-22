using System.Threading.Channels;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmWalletSettlementQueue : ILlmWalletSettlementQueue
{
    private readonly Channel<LlmWalletSettlementWorkItem> _channel =
        Channel.CreateUnbounded<LlmWalletSettlementWorkItem>(new UnboundedChannelOptions { SingleReader = true });

    internal ChannelReader<LlmWalletSettlementWorkItem> Reader => _channel.Reader;

    public void EnqueueConsume(Guid tenantId, decimal amountUsd, Guid correlationId, decimal authorizedUsd = 0m)
    {
        _channel.Writer.TryWrite(
            new LlmWalletSettlementWorkItem(LlmWalletSettlementKind.Consume, tenantId, amountUsd, correlationId, authorizedUsd));
    }

    public void EnqueueAutoRefill(Guid tenantId, Guid correlationId)
    {
        _channel.Writer.TryWrite(new LlmWalletSettlementWorkItem(LlmWalletSettlementKind.AutoRefill, tenantId, 0m, correlationId));
    }

    public void EnqueueRefillCredit(Guid tenantId, decimal amountUsd, Guid correlationId, string stripePaymentIntentId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stripePaymentIntentId);

        _channel.Writer.TryWrite(
            new LlmWalletSettlementWorkItem(
                LlmWalletSettlementKind.RefillCredit,
                tenantId,
                amountUsd,
                correlationId,
                StripePaymentIntentId: stripePaymentIntentId));
    }
}

internal enum LlmWalletSettlementKind
{
    Consume = 0,
    AutoRefill = 1,
    RefillCredit = 2,
}

internal readonly record struct LlmWalletSettlementWorkItem(
    LlmWalletSettlementKind Kind,
    Guid TenantId,
    decimal AmountUsd,
    Guid CorrelationId,
    decimal AuthorizedUsd = 0m,
    string? StripePaymentIntentId = null);
