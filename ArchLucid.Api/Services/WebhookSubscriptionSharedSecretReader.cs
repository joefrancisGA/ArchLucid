using System.Text.Json;

namespace ArchLucid.Api.Services;

/// <summary>Reads outbound webhook HMAC secrets from alert-routing subscription <c>metadataJson</c>.</summary>
public static class WebhookSubscriptionSharedSecretReader
{
    private static readonly string[] SecretKeys = ["webhookSharedSecret", "sharedSecret", "hmacSharedSecret"];

    public static string? TryRead(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(metadataJson);
            JsonElement root = document.RootElement;

            if (root.ValueKind is not JsonValueKind.Object)
            {
                return null;
            }

            foreach (string key in SecretKeys)
            {
                if (!root.TryGetProperty(key, out JsonElement value))
                {
                    continue;
                }

                string? secret = value.GetString()?.Trim();

                if (!string.IsNullOrEmpty(secret))
                {
                    return secret;
                }
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }
}
