using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>app-settings-hosts.json</c> companion rows (AX-DE-18).
/// </summary>
public static class AzureInventoryAppSettingHostParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryAppSettingHostRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "App setting host row must be a JSON object.";

            return false;
        }

        string? siteResourceId = TryReadBoundedString(element, "siteResourceId", MaxIdentifierLength);
        string? settingName = TryReadBoundedString(element, "settingName", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(siteResourceId)
            || string.IsNullOrWhiteSpace(settingName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "siteResourceId, settingName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        string? host = TryReadBoundedString(element, "host", MaxNameLength);
        string? keyVaultHost = TryReadBoundedString(element, "keyVaultHost", MaxNameLength);
        string? secretName = TryReadBoundedString(element, "secretName", MaxNameLength);

        if (AzureInventoryAppSettingHostRedactor.ShouldRejectValue(host)
            || AzureInventoryAppSettingHostRedactor.ShouldRejectValue(keyVaultHost)
            || AzureInventoryAppSettingHostRedactor.ShouldRejectValue(secretName))
        {
            errorMessage = "Companion row contains rejected secret-like content.";

            return false;
        }

        row = new AzureInventoryAppSettingHostRow
        {
            SiteResourceId = siteResourceId.Trim(),
            SettingName = settingName.Trim(),
            Host = host,
            KeyVaultHost = keyVaultHost,
            SecretName = secretName,
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
