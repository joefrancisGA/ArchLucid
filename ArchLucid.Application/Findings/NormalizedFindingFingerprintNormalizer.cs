using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Produces stable normalized fingerprints for cross-review finding correlation (ADR 0063).
/// </summary>
public static class NormalizedFindingFingerprintNormalizer
{
    /// <summary>
    ///     Builds the cross-run dedupe key when <paramref name="finding" /> has a policy rule id; otherwise returns
    ///     <see langword="null" />.
    /// </summary>
    public static string? TryBuildDedupeKey(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            return null;

        string fingerprint = NormalizeFingerprint(finding);

        return $"{finding.PolicyRuleId.Trim()}:{fingerprint}";
    }

    /// <summary>Normalized category+message fingerprint used for fuzzy and policy-rule correlation.</summary>
    public static string NormalizeFingerprint(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string category = NormalizeToken(finding.Category);
        string message = NormalizeToken(finding.Message);
        string composite = $"{category}|{message}";

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(composite));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>Normalized category+message key for fuzzy-only matching.</summary>
    public static string NormalizeFuzzyKey(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return $"{NormalizeToken(finding.Category)}|{NormalizeToken(finding.Message)}";
    }

    private static string NormalizeToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string trimmed = value.Trim().ToLowerInvariant();
        StringBuilder builder = new(trimmed.Length);
        bool previousWasSpace = false;

        foreach (char character in trimmed)
        {
            if (char.IsWhiteSpace(character))
            {
                if (!previousWasSpace)
                {
                    builder.Append(' ');
                    previousWasSpace = true;
                }

                continue;
            }

            builder.Append(character);
            previousWasSpace = false;
        }

        return builder.ToString();
    }
}
