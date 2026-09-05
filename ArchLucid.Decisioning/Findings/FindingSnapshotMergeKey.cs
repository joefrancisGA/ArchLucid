using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     ADR 0063 correlation identity for in-snapshot finding merge.
///     Same algorithm as <c>NormalizedFindingFingerprintNormalizer</c>;
///     <see cref="Finding.Title"/> plays the role of <c>ArchitectureFinding.Message</c>.
/// </summary>
public static class FindingSnapshotMergeKey
{
    /// <summary>
    ///     Policy-rule key <c>{trimmedPolicyRuleId}:{fingerprint}</c> when
    ///     <see cref="Finding.PolicyRuleId"/> is present; otherwise the fuzzy
    ///     <c>category|title</c> token key.
    /// </summary>
    public static string FromFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            string fingerprint = NormalizeFingerprint(finding.Category, finding.Title);

            return $"{finding.PolicyRuleId.Trim().ToLowerInvariant()}:{fingerprint}";
        }

        return NormalizeFuzzyKey(finding.Category, finding.Title);
    }

    /// <summary>SHA-256 hex (lower) of <c>NormalizeToken(category)|NormalizeToken(title)</c>.</summary>
    public static string NormalizeFingerprint(string? category, string? title)
    {
        string composite = $"{NormalizeToken(category)}|{NormalizeToken(title)}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(composite));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>Normalized category+title key for fuzzy-only matching (ADR 0063 fallback).</summary>
    public static string NormalizeFuzzyKey(string? category, string? title)
    {
        return $"{NormalizeToken(category)}|{NormalizeToken(title)}";
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
