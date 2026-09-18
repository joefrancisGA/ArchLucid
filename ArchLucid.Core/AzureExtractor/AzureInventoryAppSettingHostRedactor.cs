using System.Text.RegularExpressions;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Rejects setting values that look like secrets before host parsing (AX-DE-18).
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

    public static string? TryParseSqlHost(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString) || ShouldRejectValue(connectionString))
        {
            return null;
        }

        Match match = SqlServerTcpHostRegex().Match(connectionString);

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

    [GeneratedRegex(@"Server\s*=\s*tcp:(?<host>[^,;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SqlServerTcpHostRegex();

    [GeneratedRegex(
        @"@Microsoft\.KeyVault\(SecretUri\s*=\s*https?://(?<host>[^/]+)/secrets/(?<secret>[^/)]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex KeyVaultSecretUriRegex();
}
