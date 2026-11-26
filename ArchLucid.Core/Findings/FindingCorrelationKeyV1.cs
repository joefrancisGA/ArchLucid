using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Frozen ADR 0063 key formats. Cross-review correlation and snapshot merging intentionally retain
///     their different legacy rule casing. These keys do not establish scope or durable finding identity.
/// </summary>
public static class FindingCorrelationKeyV1
{
    /// <summary>Legacy cross-review policy key, preserving the trimmed rule ID's casing.</summary>
    public static string? TryBuildCrossReviewPolicyKey(string? policyRuleId, string? category, string? message) =>
        TryBuildPolicyKey(policyRuleId, category, message, lowerCaseRuleId: false);

    /// <summary>Legacy snapshot key, with a lowercase rule ID or the unhashed fuzzy fallback.</summary>
    public static string BuildSnapshotMergeKey(string? policyRuleId, string? category, string? title) =>
        TryBuildPolicyKey(policyRuleId, category, title, lowerCaseRuleId: true) ?? NormalizeFuzzyKey(category, title);

    /// <summary>Lowercase SHA-256 hex of the UTF-8 fuzzy key.</summary>
    public static string NormalizeFingerprint(string? category, string? text)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(NormalizeFuzzyKey(category, text)));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>Legacy delimiter-joined tokens. Used for possible matches, not proof of identity.</summary>
    public static string NormalizeFuzzyKey(string? category, string? text) =>
        $"{FindingCorrelationToken.Normalize(category)}|{FindingCorrelationToken.Normalize(text)}";

    private static string? TryBuildPolicyKey(string? policyRuleId, string? category, string? text, bool lowerCaseRuleId)
    {
        if (string.IsNullOrWhiteSpace(policyRuleId))
            return null;

        string ruleId = policyRuleId.Trim();
        if (lowerCaseRuleId)
            ruleId = ruleId.ToLowerInvariant();

        return $"{ruleId}:{NormalizeFingerprint(category, text)}";
    }
}
