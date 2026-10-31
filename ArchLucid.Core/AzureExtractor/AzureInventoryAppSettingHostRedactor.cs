using System.Text.RegularExpressions;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses app setting values for hostnames and target names, discarding secret material (AX-DE-18, DCH-01–03).
/// </summary>
public static partial class AzureInventoryAppSettingHostRedactor
{
    private static readonly string[] SecretMarkerSubstrings =
    [
        "Password=",
        "SharedAccessKey=",
        "AccountKey=",
        "token=",
        "secret=",
        "key=",
    ];

    public static bool ShouldRejectValue(string? value)
    {
        return ContainsSecretMarker(value);
    }

    public static bool ContainsSecretMarker(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        foreach (string marker in SecretMarkerSubstrings)
        {
            if (normalized.Contains(marker, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static AzureInventoryAppSettingHostParsedFields? TryParseSettingValue(string? value)
    {
        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsedRows = ParseSettingValues(value);

        return parsedRows.Count > 0 ? parsedRows[0] : null;
    }

    public static IReadOnlyList<AzureInventoryAppSettingHostParsedFields> ParseSettingValues(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        string trimmed = value.Trim();
        List<AzureInventoryAppSettingHostParsedFields> results = [];
        string? host = TryParseSqlHost(trimmed);
        string? catalog = TryParseSqlCatalog(trimmed, out string? catalogWarning);
        string? keyVaultHost = null;
        string? secretName = null;

        (string? parsedKeyVaultHost, string? parsedSecretName) = TryParseKeyVaultReference(trimmed);

        if (!string.IsNullOrWhiteSpace(parsedKeyVaultHost))
        {
            keyVaultHost = parsedKeyVaultHost;
            secretName = parsedSecretName;
        }

        if (string.IsNullOrWhiteSpace(host) && string.IsNullOrWhiteSpace(keyVaultHost))
        {
            string? httpsHost = TryParseHttpsHost(trimmed, out string? httpsKeyVaultHost);

            if (!string.IsNullOrWhiteSpace(httpsKeyVaultHost))
            {
                keyVaultHost = httpsKeyVaultHost;
            }
            else if (!string.IsNullOrWhiteSpace(httpsHost))
            {
                host = httpsHost;
            }
        }

        AzureInventoryAppSettingHostParsedFields primary = new()
        {
            Host = host,
            Catalog = catalog,
            KeyVaultHost = keyVaultHost,
            SecretName = secretName,
            WarningCode = catalogWarning,
        };

        if (primary.HasAnyField)
        {
            results.Add(primary);
        }

        AzureInventoryAppSettingHostConnectionStringParser.AppendConnectionHosts(trimmed, results);

        return DeduplicateParsedRows(results);
    }

    public static string? TryParseSqlHost(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return null;
        }

        Match match = SqlServerHostRegex().Match(connectionString);

        if (!match.Success)
        {
            return null;
        }

        string host = match.Groups["host"].Value.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        return NormalizeSqlInventoryHost(host);
    }

    public static string? TryParseSqlCatalog(string? connectionString, out string? warningCode)
    {
        warningCode = null;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return null;
        }

        Match match = SqlCatalogRegex().Match(connectionString);

        if (!match.Success)
        {
            return null;
        }

        string catalog = Uri.UnescapeDataString(match.Groups["catalog"].Value.Trim());

        if (string.IsNullOrWhiteSpace(catalog))
        {
            return null;
        }

        if (ContainsCatalogTemplatePlaceholder(catalog))
        {
            warningCode = AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate;

            return null;
        }

        return catalog;
    }

    public static string? TryParseHttpsHost(string? value, out string? keyVaultHost)
    {
        keyVaultHost = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        Match match = HttpsHostRegex().Match(value.Trim());

        if (!match.Success)
        {
            return null;
        }

        string host = match.Groups["host"].Value.Trim().ToLowerInvariant();
        int queryOrFragmentStart = host.IndexOfAny(['?', '#']);

        if (queryOrFragmentStart >= 0)
        {
            host = host[..queryOrFragmentStart];
        }

        host = host.TrimEnd('/');

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        if (host.EndsWith(".vault.azure.net", StringComparison.OrdinalIgnoreCase))
        {
            keyVaultHost = NormalizeHttpsInventoryHost(host);

            return null;
        }

        return NormalizeHttpsInventoryHost(host);
    }

    internal static string StripDecodedInventoryHostPathSeparators(string decoded)
    {
        return decoded.Replace("\\", string.Empty, StringComparison.Ordinal)
            .Replace("/", string.Empty, StringComparison.Ordinal)
            .Replace("?", string.Empty, StringComparison.Ordinal)
            .Replace("#", string.Empty, StringComparison.Ordinal);
    }

    private static bool ShouldNormalizeKeyVaultSecretUriHost(string vaultHost)
    {
        return vaultHost.Contains("%2f", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%5c", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%23", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%3f", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%252f", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%255c", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%2523", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%253f", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%252523", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%25252f", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%25255c", StringComparison.OrdinalIgnoreCase)
               || vaultHost.Contains("%25253f", StringComparison.OrdinalIgnoreCase);
    }

    internal static string DecodeInventoryHostPercentEncoding(string value)
    {
        string decoded = value;

        for (int pass = 0; pass < 4 && decoded.Contains('%', StringComparison.Ordinal); pass++)
        {
            string next = Uri.UnescapeDataString(decoded);

            if (string.Equals(next, decoded, StringComparison.Ordinal))
            {
                break;
            }

            decoded = next;
        }

        return decoded;
    }

    private static string NormalizeSqlInventoryHost(string host)
    {
        string decoded = DecodeInventoryHostPercentEncoding(host);
        int commaIndex = decoded.IndexOf(',');

        if (commaIndex >= 0)
        {
            decoded = decoded[..commaIndex];
        }

        decoded = StripDecodedInventoryHostPathSeparators(decoded);

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded.ToLowerInvariant();
    }

    private static string NormalizeHttpsInventoryHost(string host)
    {
        string decoded = StripDecodedInventoryHostPathSeparators(DecodeInventoryHostPercentEncoding(host));

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded;
    }

    public static (string? KeyVaultHost, string? SecretName) TryParseKeyVaultReference(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return (null, null);
        }

        string trimmed = value.Trim();

        Match match = KeyVaultSecretUriRegex().Match(trimmed);

        if (match.Success)
        {
            string rawVaultHost = match.Groups["host"].Value.Trim();
            string vaultHost = ShouldNormalizeKeyVaultSecretUriHost(rawVaultHost)
                ? NormalizeHttpsInventoryHost(rawVaultHost)
                : rawVaultHost.ToLowerInvariant();
            string secretName = match.Groups["secret"].Value.Trim();

            if (string.IsNullOrWhiteSpace(vaultHost) || string.IsNullOrWhiteSpace(secretName))
            {
                return (null, null);
            }

            return (vaultHost, secretName);
        }

        Match vaultNameMatch = KeyVaultVaultNameReferenceRegex().Match(trimmed);

        if (!vaultNameMatch.Success)
        {
            return (null, null);
        }

        string vaultNameRaw = vaultNameMatch.Groups["vault"].Value.Trim();
        string vaultName = vaultNameRaw.ToLowerInvariant();
        string vaultNameSecret = vaultNameMatch.Groups["secret"].Value.Trim();

        if (string.IsNullOrWhiteSpace(vaultName) || string.IsNullOrWhiteSpace(vaultNameSecret))
        {
            return (null, null);
        }

        string resolvedVaultHost = vaultName.Contains(".vault.", StringComparison.OrdinalIgnoreCase)
            || vaultName.EndsWith(".vault.azure.net", StringComparison.OrdinalIgnoreCase)
            ? vaultName
            : $"{vaultName}.vault.azure.net";

        if (ShouldNormalizeKeyVaultSecretUriHost(vaultNameRaw))
        {
            resolvedVaultHost = NormalizeHttpsInventoryHost(resolvedVaultHost);
        }

        return (resolvedVaultHost, vaultNameSecret);
    }

    private static IReadOnlyList<AzureInventoryAppSettingHostParsedFields> DeduplicateParsedRows(
        List<AzureInventoryAppSettingHostParsedFields> results)
    {
        if (results.Count <= 1)
        {
            return results;
        }

        List<AzureInventoryAppSettingHostParsedFields> deduplicated = [];
        HashSet<string> seenHosts = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryAppSettingHostParsedFields row in results)
        {
            if (!string.IsNullOrWhiteSpace(row.Host))
            {
                if (!seenHosts.Add(row.Host.Trim()))
                {
                    continue;
                }
            }

            deduplicated.Add(row);
        }

        return deduplicated;
    }

    private static bool ContainsCatalogTemplatePlaceholder(string catalog)
    {
        return catalog.Contains('{', StringComparison.Ordinal)
               || catalog.Contains('}', StringComparison.Ordinal)
               || catalog.Contains("{0}", StringComparison.OrdinalIgnoreCase)
               || catalog.Contains("{tenant}", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(
        @"(?:Server|Data\s+Source|Host)\s*=\s*(?:tcp:)?(?<host>[^,;]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SqlServerHostRegex();

    [GeneratedRegex(
        @"(?:Initial\s+Catalog|Database)\s*=\s*(?<catalog>[^;]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SqlCatalogRegex();

    [GeneratedRegex(@"https?://(?<host>[^/\s;:]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HttpsHostRegex();

    [GeneratedRegex(
        @"@Microsoft\.KeyVault\(SecretUri\s*=\s*https?://(?<host>[^/]+)/secrets/(?<secret>[^/)]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex KeyVaultSecretUriRegex();

    [GeneratedRegex(
        @"@Microsoft\.KeyVault\(\s*VaultName\s*=\s*(?<vault>[^;)]+)\s*;\s*SecretName\s*=\s*(?<secret>[^)]+)\s*\)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex KeyVaultVaultNameReferenceRegex();
}
