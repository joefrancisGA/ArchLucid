using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads non-secret scalar values from ADF <c>typeProperties</c> payloads.
/// </summary>
public static class AzureInventoryAdfTypePropertyReader
{
    private static readonly HashSet<string> BlockedTypePropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "connectionString",
        "password",
        "accountKey",
        "secretKey",
        "clientSecret",
        "servicePrincipalKey",
        "encryptedCredential",
        "sasToken",
        "accessKey",
        "apiKey",
        "token",
        "key",
        "credentials",
    };

    public static string? TryReadAllowedScalar(JsonElement element, string propertyName)
    {
        if (BlockedTypePropertyNames.Contains(propertyName))
        {
            return null;
        }

        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        if (value.ValueKind is JsonValueKind.Object
            && value.TryGetProperty("type", out JsonElement secureTypeElement)
            && secureTypeElement.ValueKind is JsonValueKind.String
            && secureTypeElement.GetString()?.Equals("SecureString", StringComparison.OrdinalIgnoreCase) == true)
        {
            return null;
        }

        if (value.ValueKind is not JsonValueKind.String and not JsonValueKind.Number and not JsonValueKind.True and not JsonValueKind.False)
        {
            return null;
        }

        string? text = value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(propertyName))
        {
            return null;
        }

        return text.Trim();
    }
}
