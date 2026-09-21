using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts redacted app-setting host rows from Container App ARM GET payloads (SN-RT-01).
/// </summary>
public static class AzureInventoryContainerAppEnvHostExtractor
{
    private const string ContainerAppsApiVersion = "2024-03-01";

    public static IReadOnlyList<AzureInventoryAppSettingHostRow> ExtractRows(
        string containerAppResourceId,
        JsonElement resourceRoot)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(containerAppResourceId);

        if (resourceRoot.ValueKind is not JsonValueKind.Object)
        {
            return [];
        }

        if (!resourceRoot.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object
            || !propertiesElement.TryGetProperty("template", out JsonElement templateElement)
            || templateElement.ValueKind is not JsonValueKind.Object
            || !templateElement.TryGetProperty("containers", out JsonElement containersElement)
            || containersElement.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<AzureInventoryAppSettingHostRow> rows = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);
        string normalizedResourceId = containerAppResourceId.Trim();

        foreach (JsonElement containerElement in containersElement.EnumerateArray())
        {
            if (containerElement.ValueKind is not JsonValueKind.Object
                || !containerElement.TryGetProperty("env", out JsonElement envElement)
                || envElement.ValueKind is not JsonValueKind.Array)
            {
                continue;
            }

            foreach (JsonElement envEntry in envElement.EnumerateArray())
            {
                AddEnvEntryRow(normalizedResourceId, envEntry, rows, seenKeys);
            }
        }

        return rows;
    }

    public static bool HasTemplateEnvEntries(JsonElement resourceRoot)
    {
        if (resourceRoot.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        if (!resourceRoot.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object
            || !propertiesElement.TryGetProperty("template", out JsonElement templateElement)
            || templateElement.ValueKind is not JsonValueKind.Object
            || !templateElement.TryGetProperty("containers", out JsonElement containersElement)
            || containersElement.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement containerElement in containersElement.EnumerateArray())
        {
            if (containerElement.ValueKind is JsonValueKind.Object
                && containerElement.TryGetProperty("env", out JsonElement envElement)
                && envElement.ValueKind is JsonValueKind.Array
                && envElement.GetArrayLength() > 0)
            {
                return true;
            }
        }

        return false;
    }

    public static string ContainerAppsApiVersionValue => ContainerAppsApiVersion;

    private static void AddEnvEntryRow(
        string containerAppResourceId,
        JsonElement envEntry,
        List<AzureInventoryAppSettingHostRow> rows,
        HashSet<string> seenKeys)
    {
        if (envEntry.ValueKind is not JsonValueKind.Object
            || !envEntry.TryGetProperty("name", out JsonElement nameElement)
            || nameElement.ValueKind is not JsonValueKind.String)
        {
            return;
        }

        string settingName = nameElement.GetString()?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(settingName))
        {
            return;
        }

        string? settingValue = null;
        string? secretRef = null;

        if (envEntry.TryGetProperty("value", out JsonElement valueElement)
            && valueElement.ValueKind is JsonValueKind.String)
        {
            settingValue = valueElement.GetString();
        }

        if (envEntry.TryGetProperty("secretRef", out JsonElement secretRefElement)
            && secretRefElement.ValueKind is JsonValueKind.String)
        {
            secretRef = secretRefElement.GetString()?.Trim();
        }

        AzureInventoryAppSettingHostParsedFields? parsed =
            string.IsNullOrWhiteSpace(settingValue) ? null : AzureInventoryAppSettingHostRedactor.TryParseSettingValue(settingValue);

        if (parsed is null && string.IsNullOrWhiteSpace(secretRef))
        {
            return;
        }

        string host = parsed?.Host ?? string.Empty;
        string keyVaultHost = parsed?.KeyVaultHost ?? string.Empty;
        string secretName = parsed?.SecretName ?? string.Empty;
        string catalog = parsed?.Catalog ?? string.Empty;
        string warningCode = parsed?.WarningCode ?? string.Empty;
        string secretRefValue = secretRef ?? string.Empty;

        string key =
            $"{containerAppResourceId}|{settingName}|{host}|{keyVaultHost}|{secretName}|{catalog}|{secretRefValue}";

        if (!seenKeys.Add(key))
        {
            return;
        }

        rows.Add(new AzureInventoryAppSettingHostRow
        {
            SiteResourceId = containerAppResourceId,
            SettingName = settingName,
            Host = parsed?.Host,
            Catalog = parsed?.Catalog,
            KeyVaultHost = parsed?.KeyVaultHost,
            SecretName = parsed?.SecretName,
            SecretRef = secretRef,
            WarningCode = parsed?.WarningCode,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        });
    }
}
