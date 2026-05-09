using System.Globalization;
using System.Security.Cryptography;
using System.Text;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>Shared Stripe webhook signing secret and v1 signature builder for checkout E2E tests.</summary>
/// <remarks>
///     <para>
///         Webhook <c>RawBody</c> is verified by <c>EventUtility.ConstructEvent</c> inside <c>StripeBillingProvider</c>.
///         Signing matches <c>StripeBillingProviderCheckoutWebhookIdempotencyTests</c>.
///     </para>
///     <para>
///         <c>construct_event_dependencies</c> in the event JSON must use the same <see cref="StripeNetWebhookApiVersion" />
///         string as the referenced <c>Stripe.net</c> package.
///     </para>
///     <para>
///         Stripe.net <c>EventConverter</c> expects a top-level <c>request</c> key (often <c>null</c>). In-proc
///         <c>Event.ToJson()</c> may omit it, which can leave <c>Event.Data.Object</c> null after <c>ConstructEvent</c>
///         and skip checkout activation while still returning HTTP 200. Use <see cref="BuildCheckoutSessionCompletedWebhookJson" /> for E2E payloads.
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
        long timestamp = TimeProvider.System.GetUtcNow().ToUnixTimeSeconds();
        string signedPayload = $"{timestamp}.{payload}";

        using HMACSHA256 hmac = new(key);
        byte[] mac = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        string hex = Convert.ToHexString(mac).ToLowerInvariant();

        return $"t={timestamp},v1={hex}";
    }

    /// <summary>Builds JSON acceptable to <c>EventUtility.ConstructEvent</c> for <c>checkout.session.completed</c>.</summary>
    internal static string BuildCheckoutSessionCompletedWebhookJson(
        string eventId,
        string checkoutSessionId,
        string subscriptionId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string checkoutTierLabel,
        int seats,
        int workspaces)
    {
        JObject metadata = new JObject
        {
            ["tenant_id"] = tenantId.ToString("D"),
            ["workspace_id"] = workspaceId.ToString("D"),
            ["project_id"] = projectId.ToString("D"),
            ["tier"] = checkoutTierLabel,
            ["seats"] = seats.ToString(CultureInfo.InvariantCulture),
            ["workspaces"] = workspaces.ToString(CultureInfo.InvariantCulture)
        };

        JObject payload = new JObject
        {
            ["id"] = eventId,
            ["type"] = "checkout.session.completed",
            ["api_version"] = StripeNetWebhookApiVersion,
            ["data"] = new JObject
            {
                ["object"] = new JObject
                {
                    ["object"] = "checkout.session",
                    ["id"] = checkoutSessionId,
                    ["subscription"] = subscriptionId,
                    ["metadata"] = metadata
                }
            },
            ["request"] = JValue.CreateNull()
        };

        return payload.ToString(Formatting.None);
    }
}
