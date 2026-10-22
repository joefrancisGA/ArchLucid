using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Persistence.Billing;

internal static class BillingMarketplaceWebhookDedupeKey
{
    internal static string Build(string subscriptionId, string action, string rawBody)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawBody));
        string payloadFingerprint = Convert.ToHexString(hash).ToLowerInvariant();

        return $"{subscriptionId}|{action}|{payloadFingerprint}";
    }
}
