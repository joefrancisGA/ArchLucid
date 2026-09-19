using System.Text.RegularExpressions;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Rejects setting values that look like secrets before host parsing (AX-DE-18, SN-RT-02).
/// </summary>
public static partial class AzureInventoryAppSettingHostRedactor
{
    private static readonly string[] RejectedSubstrings =
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
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        foreach (string rejected in RejectedSubstrings)
        {
            if (normalized.Contains(rejected, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static AzureInventoryAppSettingHostParsedFields? TryParseSettingValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || ShouldRejectValue(value))
        {
            return null;
        }

        string trimmed = value.Trim();
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

        AzureInventoryAppSettingHostParsedFields parsed = new()
        {
            Host = host,
            Catalog = catalog,
            KeyVaultHost = keyVaultHost,
            SecretName = secretName,
            WarningCode = catalogWarning,
        };

        return parsed.HasAnyField ? parsed : null;
    }

    public static string? TryParseSqlHost(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString) || ShouldRejectValue(connectionString))
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

        return host;
    }

    public static string? TryParseSqlCatalog(string? connectionString, out string? warningCode)
    {
        warningCode = null;

        if (string.IsNullOrWhiteSpace(connectionString) || ShouldRejectValue(connectionString))
        {
            return null;
        }

        Match match = SqlCatalogRegex().Match(connectionString);

        if (!match.Success)
        {
            return null;
        }

        string catalog = match.Groups["catalog"].Value.Trim();

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

        if (string.IsNullOrWhiteSpace(value) || ShouldRejectValue(value))
        {
            return null;
        }

        Match match = HttpsHostRegex().Match(value.Trim());

        if (!match.Success)
        {
            return null;
        }

        string host = match.Groups["host"].Value.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        if (host.EndsWith(".vault.azure.net", StringComparison.OrdinalIgnoreCase))
        {
            keyVaultHost = host;

            return null;
        }

        return host;
    }

    public static (string? KeyVaultHost, string? SecretName) TryParseKeyVaultReference(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || ShouldRejectValue(value))
        {
            return (null, null);
        }

        Match match = KeyVaultSecretUriRegex().Match(value.Trim());

        if (!match.Success)
        {
            return (null, null);
        }

        string vaultHost = match.Groups["host"].Value.Trim().ToLowerInvariant();
        string secretName = match.Groups["secret"].Value.Trim();

        if (string.IsNullOrWhiteSpace(vaultHost) || string.IsNullOrWhiteSpace(secretName))
        {
            return (null, null);
        }

        return (vaultHost, secretName);
    }

    private static bool ContainsCatalogTemplatePlaceholder(string catalog)
    {
        return catalog.Contains('{', StringComparison.Ordinal)
               || catalog.Contains('}', StringComparison.Ordinal)
               || catalog.Contains("{0}", StringComparison.OrdinalIgnoreCase)
               || catalog.Contains("{tenant}", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(@"Server\s*=\s*(?:tcp:)?(?<host>[^,;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SqlServerHostRegex();

    [GeneratedRegex(
        @"(?:Initial\s+Catalog|Database)\s*=\s*(?<catalog>[^;]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SqlCatalogRegex();

    [GeneratedRegex(@"https?://(?<host>[^/\s;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HttpsHostRegex();

    [GeneratedRegex(
        @"@Microsoft\.KeyVault\(SecretUri\s*=\s*https?://(?<host>[^/]+)/secrets/(?<secret>[^/)]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex KeyVaultSecretUriRegex();
}
