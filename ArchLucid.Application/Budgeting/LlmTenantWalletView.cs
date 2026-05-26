using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmTenantWalletView
{
    public decimal BalanceUsd { get; init; }

    public bool AutoReplenishEnabled { get; init; }

    public decimal MonthlyCapUsd { get; init; }

    public decimal RefillIncrementUsd { get; init; }

    public decimal RefillTriggerThresholdUsd { get; init; }

    public int AutoRefillsThisUtcMonthCount { get; init; }

    public DateTimeOffset? LastRefillUtc { get; init; }

    public bool HasPaymentMethod { get; init; }

    public byte[] RowVersion { get; init; } = [];
}
