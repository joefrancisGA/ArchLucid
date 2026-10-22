namespace ArchLucid.Core.Billing;

public sealed class StripeWalletChargeResult
{
    public bool Succeeded { get; init; }

    public string? PaymentIntentId { get; init; }

    public string? DeclineCode { get; init; }

    public string? ErrorMessage { get; init; }

    public static StripeWalletChargeResult Ok(string paymentIntentId) =>
        new() { Succeeded = true, PaymentIntentId = paymentIntentId };

    public static StripeWalletChargeResult Failed(string? declineCode, string? message) =>
        new() { DeclineCode = declineCode, ErrorMessage = message };
}
