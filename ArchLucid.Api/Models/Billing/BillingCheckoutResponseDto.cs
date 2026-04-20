namespace ArchLucid.Api.Models.Billing;

public sealed class BillingCheckoutResponseDto
{
    public required string CheckoutUrl
    {
        get; init;
    }

    public required string ProviderSessionId
    {
        get; init;
    }

    public DateTimeOffset? ExpiresUtc
    {
        get; init;
    }
}
