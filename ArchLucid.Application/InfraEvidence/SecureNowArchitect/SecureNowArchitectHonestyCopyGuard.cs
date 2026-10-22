using System.Text.RegularExpressions;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>
///     Deny-list guard for SecureNow architect desk copy (SA-21).
///     Rejects false precision and overclaimed movement language.
/// </summary>
public static partial class SecureNowArchitectHonestyCopyGuard
{
    private static readonly string[] DenyList =
    [
        "exfiltrat",
        "data flowed",
        "will leak",
        "phi left the vnet",
        "apply to azure",
    ];

    public static bool IsHonestCopy(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        if (ConfidencePercentPattern().IsMatch(text))
        {
            return false;
        }

        if (ContainsAuditorCompliantConclusion(text))
        {
            return false;
        }

        foreach (string denied in DenyList)
        {
            if (text.Contains(denied, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static bool ContainsAuditorCompliantConclusion(string text)
    {
        if (!text.Contains("compliant", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return text.Contains("auditor", StringComparison.OrdinalIgnoreCase)
               || text.Contains("attestation", StringComparison.OrdinalIgnoreCase)
               || text.Contains("soc 2", StringComparison.OrdinalIgnoreCase)
               || text.Contains("certified", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(@"\d+\s*%")]
    private static partial Regex ConfidencePercentPattern();
}
