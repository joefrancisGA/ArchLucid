using System.Globalization;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

using Stripe;

namespace ArchLucid.Persistence.Billing.Stripe;

public sealed class StripeWalletGateway(IOptionsMonitor<BillingOptions> billingOptions) : IStripeWalletGateway
{
    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    public async Task<StripeWalletChargeResult> ChargeRefillAsync(
        Guid tenantId,
        string stripeCustomerId,
        string stripePaymentMethodId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        string? secretKey = _billingOptions.CurrentValue.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            return StripeWalletChargeResult.Failed(null, "Billing:Stripe:SecretKey is not configured.");

        long amountCents = (long)decimal.Round(amountUsd * 100m, 0, MidpointRounding.AwayFromZero);

        if (amountCents < 50)
            return StripeWalletChargeResult.Failed(null, "Refill amount below Stripe minimum.");

        PaymentIntentCreateOptions options = new()
        {
            Amount = amountCents,
            Currency = "usd",
            Customer = stripeCustomerId,
            PaymentMethod = stripePaymentMethodId,
            Confirm = true,
            OffSession = true,
            Metadata = new Dictionary<string, string>
            {
                ["tenant_id"] = tenantId.ToString("D", CultureInfo.InvariantCulture),
                ["purpose"] = "llm_wallet_refill",
                ["correlation_id"] = correlationId.ToString("D", CultureInfo.InvariantCulture),
            },
        };

        RequestOptions requestOptions = new() { ApiKey = secretKey };

        try
        {
            PaymentIntentService service = new();
            PaymentIntent intent = await service.CreateAsync(options, requestOptions, cancellationToken).ConfigureAwait(false);

            if (string.Equals(intent.Status, "succeeded", StringComparison.OrdinalIgnoreCase))
                return StripeWalletChargeResult.Ok(intent.Id);

            return StripeWalletChargeResult.Failed(intent.LastPaymentError?.DeclineCode, intent.LastPaymentError?.Message ?? intent.Status);
        }
        catch (StripeException ex)
        {
            return StripeWalletChargeResult.Failed(ex.StripeError?.DeclineCode, ex.Message);
        }
    }
}
