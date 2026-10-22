namespace ArchLucid.Core.Billing;

public sealed class StripeWalletChargeResult
{
    public bool Succeeded { get; init; }

    public string? PaymentIntentId { get; init; }

    public string? DeclineCode { get; init; }

    public string? ErrorMessage { get; init; }

    /// <summary>Stripe accepted the off-session charge but settlement is not complete yet (e.g. <c>processing</c>).</summary>
    public bool AwaitingPaymentCompletion { get; init; }

    public static StripeWalletChargeResult Ok(string paymentIntentId) =>
        new() { Succeeded = true, PaymentIntentId = paymentIntentId };

    public static StripeWalletChargeResult AwaitingCompletion(string paymentIntentId, string status) =>
        new()
        {
            PaymentIntentId = paymentIntentId,
            DeclineCode = status,
            ErrorMessage = status,
            AwaitingPaymentCompletion = true,
        };

    public static StripeWalletChargeResult Failed(string? declineCode, string? message) =>
        new() { DeclineCode = declineCode, ErrorMessage = message };
}
