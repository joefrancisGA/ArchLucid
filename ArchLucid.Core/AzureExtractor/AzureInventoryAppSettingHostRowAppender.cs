namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Builds companion rows from a setting name and value without retaining the value (DCH-03).
/// </summary>
public static class AzureInventoryAppSettingHostRowAppender
{
    public static void AppendParsedRows(
        string siteResourceId,
        string settingName,
        string? settingValue,
        string? secretRef,
        List<AzureInventoryAppSettingHostRow> rows,
        HashSet<string> seenKeys)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(siteResourceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(settingName);
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(seenKeys);

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsedRows =
            string.IsNullOrWhiteSpace(settingValue)
                ? []
                : AzureInventoryAppSettingHostRedactor.ParseSettingValues(settingValue);

        if (parsedRows.Count == 0 && string.IsNullOrWhiteSpace(secretRef))
        {
            return;
        }

        if (parsedRows.Count == 0)
        {
            TryAddRow(
                siteResourceId,
                settingName,
                host: null,
                catalog: null,
                keyVaultHost: null,
                secretName: null,
                secretRef: secretRef,
                warningCode: null,
                rows,
                seenKeys);

            return;
        }

        foreach (AzureInventoryAppSettingHostParsedFields parsed in parsedRows)
        {
            TryAddRow(
                siteResourceId,
                settingName,
                parsed.Host,
                parsed.Catalog,
                parsed.KeyVaultHost,
                parsed.SecretName,
                secretRef,
                parsed.WarningCode,
                rows,
                seenKeys);
        }
    }

    private static void TryAddRow(
        string siteResourceId,
        string settingName,
        string? host,
        string? catalog,
        string? keyVaultHost,
        string? secretName,
        string? secretRef,
        string? warningCode,
        List<AzureInventoryAppSettingHostRow> rows,
        HashSet<string> seenKeys)
    {
        string hostValue = host ?? string.Empty;
        string catalogValue = catalog ?? string.Empty;
        string keyVaultHostValue = keyVaultHost ?? string.Empty;
        string secretNameValue = secretName ?? string.Empty;
        string secretRefValue = secretRef ?? string.Empty;
        string warningCodeValue = warningCode ?? string.Empty;

        string key =
            $"{siteResourceId}|{settingName}|{hostValue}|{catalogValue}|{keyVaultHostValue}|{secretNameValue}|{secretRefValue}|{warningCodeValue}";

        if (!seenKeys.Add(key))
        {
            return;
        }

        rows.Add(new AzureInventoryAppSettingHostRow
        {
            SiteResourceId = siteResourceId.Trim(),
            SettingName = settingName.Trim(),
            Host = host,
            Catalog = catalog,
            KeyVaultHost = keyVaultHost,
            SecretName = secretName,
            SecretRef = secretRef,
            WarningCode = warningCode,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        });
    }
}
