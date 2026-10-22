using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

using Stripe;

namespace ArchLucid.Persistence.Billing.Stripe;

public sealed class StripeWalletPaymentIdentifierGuard(
    IStripeLinkedCustomerResolver linkedCustomerResolver,
    IOptionsMonitor<BillingOptions> billingOptions) : IStripeWalletPaymentIdentifierGuard
{
    private readonly IStripeLinkedCustomerResolver _linkedCustomerResolver =
        linkedCustomerResolver ?? throw new ArgumentNullException(nameof(linkedCustomerResolver));

    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    public async Task<bool> AllowsWalletUpdateAsync(
        Guid tenantId,
        string? stripeCustomerId,
        string? stripePaymentMethodId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(stripeCustomerId) && string.IsNullOrWhiteSpace(stripePaymentMethodId))
            return true;

        string? linkedCustomerId;

        try
        {
            linkedCustomerId = await _linkedCustomerResolver
                .TryResolveLinkedCustomerIdAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (StripeException)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(linkedCustomerId))
            return false;

        string effectiveCustomerId = string.IsNullOrWhiteSpace(stripeCustomerId)
            ? linkedCustomerId
            : stripeCustomerId.Trim();

        if (!string.Equals(effectiveCustomerId, linkedCustomerId, StringComparison.Ordinal))
            return false;

        if (string.IsNullOrWhiteSpace(stripePaymentMethodId))
            return true;

        string? secretKey = _billingOptions.CurrentValue.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            return false;

        return await IsPaymentMethodAttachedToCustomerAsync(
            stripePaymentMethodId.Trim(),
            linkedCustomerId,
            secretKey,
            cancellationToken).ConfigureAwait(false);
    }

    private static async Task<bool> IsPaymentMethodAttachedToCustomerAsync(
        string paymentMethodId,
        string customerId,
        string secretKey,
        CancellationToken cancellationToken)
    {
        RequestOptions requestOptions = new() { ApiKey = secretKey };

        try
        {
            PaymentMethodService service = new();
            PaymentMethod paymentMethod = await service
                .GetAsync(paymentMethodId, requestOptions: requestOptions, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            return string.Equals(paymentMethod.CustomerId, customerId, StringComparison.Ordinal);
        }
        catch (StripeException)
        {
            return false;
        }
    }
}
