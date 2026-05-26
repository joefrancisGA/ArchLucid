namespace ArchLucid.Api.Models.Billing;

public sealed class LlmTenantWalletPutRequest
{
    public bool? AutoReplenishEnabled { get; init; }

    public decimal? MonthlyCapUsd { get; init; }

    public string? StripeCustomerId { get; init; }

    public string? StripePaymentMethodId { get; init; }

    public string? RowVersionBase64 { get; init; }
}
