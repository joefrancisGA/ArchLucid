using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>Shared Stripe webhook signing secret and v1 signature builder for checkout E2E tests.</summary>
/// <remarks>
///     <para>
///         <b>Webhook payload:</b> Stripe.net serializes a <c>checkout.session.completed</c> event. The API verifies
///         <c>Stripe-Signature</c> via <c>EventUtility.ConstructEvent</c> inside <c>StripeBillingProvider</c> (no outbound
///         HTTP). The signing treatment matches <c>StripeBillingProviderCheckoutWebhookIdempotencyTests</c>.
///     </para>
///     <para>
///         <c>construct_event_dependencies</c> in the event JSON must use the same <see cref="StripeNetWebhookApiVersion" />
///         string as the referenced <c>Stripe.net</c> package.
///     </para>
/// </remarks>
internal static class StripeCheckoutE2EWebhookTestSigning
{
    /// <summary>Must match the API version pinned by the <c>Stripe.net</c> package (see <c>Directory.Packages.props</c>).</summary>
    internal const string StripeNetWebhookApiVersion = "2025-08-27.basil";

    /// <summary>32-byte material after <c>whsec_</c> (UTF-8 signing key per Stripe.net v48+).</summary>
    internal static string WebhookSigningSecret
    {
        get;
    } = BuildSigningSecret();

    private static string BuildSigningSecret()
    {
        byte[] keyMaterial = new byte[32];
        Array.Fill(keyMaterial, (byte)11);

        return "whsec_" + Convert.ToBase64String(keyMaterial);
    }

    internal static string BuildStripeV1Signature(string whsecSecret, string payload)
    {
        if (!whsecSecret.StartsWith("whsec_", StringComparison.Ordinal))
        {
            throw new ArgumentException("Expected whsec_ prefix.", nameof(whsecSecret));
        }

        // Stripe.net EventUtility uses UTF-8 bytes of the full secret string (v48.x), not whsec_ base64 decode.
        byte[] key = Encoding.UTF8.GetBytes(whsecSecret);
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        string signedPayload = $"{timestamp}.{payload}";

        using HMACSHA256 hmac = new(key);
        byte[] mac = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        string hex = Convert.ToHexString(mac).ToLowerInvariant();

        return $"t={timestamp},v1={hex}";
    }
}
