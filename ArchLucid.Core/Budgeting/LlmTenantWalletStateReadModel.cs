namespace ArchLucid.Core.Budgeting;

public sealed class LlmTenantWalletStateReadModel
{
    public Guid TenantId { get; init; }

    public decimal BalanceUsd { get; init; }

    public bool AutoReplenishEnabled { get; init; }

    public decimal RefillIncrementUsd { get; init; }

    public decimal RefillTriggerThresholdUsd { get; init; }

    public decimal MonthlyCapUsd { get; init; }

    public int AutoRefillsThisUtcMonthCount { get; init; }

    public int AutoRefillsThisUtcMonthYearMonth { get; init; }

    public DateTimeOffset? LastRefillUtc { get; init; }

    public string? StripeCustomerId { get; init; }

    public string? StripePaymentMethodId { get; init; }

    public byte[] RowVersion { get; init; } = [];
}
