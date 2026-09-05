using System.Globalization;
using System.Text.RegularExpressions;

namespace ArchLucid.Core.Identity;

/// <summary>Normalizes email domains for sign-in routing and ownership verification.</summary>
public static partial class AuthEmailDomainNormalizer
{
    private static readonly Regex DomainLabelPattern = DomainLabelRegex();

    public static bool TryNormalize(string? domainOrEmail, out string normalizedDomain, out string displayDomain)
    {
        normalizedDomain = string.Empty;
        displayDomain = string.Empty;

        if (string.IsNullOrWhiteSpace(domainOrEmail))
        {
            return false;
        }

        string candidate = domainOrEmail.Trim();

        int at = candidate.LastIndexOf('@');

        if (at >= 0)
        {
            candidate = candidate[(at + 1)..];
        }

        candidate = candidate.Trim().TrimEnd('.');

        if (candidate.Length is 0 or > 253)
        {
            return false;
        }

        normalizedDomain = candidate.ToLower(CultureInfo.InvariantCulture);

        if (!IsValidDomain(normalizedDomain))
        {
            normalizedDomain = string.Empty;
            displayDomain = string.Empty;

            return false;
        }

        displayDomain = normalizedDomain;

        return true;
    }

    public static string BuildDnsVerificationRecordValue(string verificationToken) =>
        $"archlucid-domain-verification={verificationToken}";

    private static bool IsValidDomain(string normalizedDomain)
    {
        if (normalizedDomain.Contains(' ') || normalizedDomain.StartsWith("-", StringComparison.Ordinal))
        {
            return false;
        }

        if (normalizedDomain.Contains("..", StringComparison.Ordinal))
        {
            return false;
        }

        string[] labels = normalizedDomain.Split('.', StringSplitOptions.TrimEntries);

        if (labels.Length < 2)
        {
            return false;
        }

        foreach (string label in labels)
        {
            if (label.Length is 0 or > 63 || !DomainLabelPattern.IsMatch(label))
            {
                return false;
            }
        }

        return true;
    }

    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$", RegexOptions.CultureInvariant)]
    private static partial Regex DomainLabelRegex();
}
