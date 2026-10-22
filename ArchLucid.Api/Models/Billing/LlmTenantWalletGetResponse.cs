namespace ArchLucid.Api.Models.Billing;

public sealed class LlmTenantWalletGetResponse
{
    public decimal BalanceUsd { get; init; }

    public bool AutoReplenishEnabled { get; init; }

    public decimal MonthlyCapUsd { get; init; }

    public decimal RefillIncrementUsd { get; init; }

    public decimal RefillTriggerThresholdUsd { get; init; }

    public int AutoRefillsThisUtcMonthCount { get; init; }

    public DateTimeOffset? LastRefillUtc { get; init; }

    public bool HasPaymentMethod { get; init; }

    public string? StripePublishableKey { get; init; }

    public string RowVersionBase64 { get; init; } = string.Empty;
}
