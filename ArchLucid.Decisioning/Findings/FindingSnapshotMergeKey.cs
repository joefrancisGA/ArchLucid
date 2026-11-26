using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     ADR 0063 correlation identity for in-snapshot finding merge.
///     Shares V1 normalization with cross-review correlation, but retains lowercase policy rule IDs.
/// </summary>
public static class FindingSnapshotMergeKey
{
    /// <summary>
    ///     Policy-rule key <c>{lowercaseTrimmedPolicyRuleId}:{fingerprint}</c> when
    ///     <see cref="Finding.PolicyRuleId"/> is present; otherwise the fuzzy
    ///     <c>category|title</c> token key.
    /// </summary>
    public static string FromFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return FindingCorrelationKeyV1.BuildSnapshotMergeKey(finding.PolicyRuleId, finding.Category, finding.Title);
    }

    /// <summary>SHA-256 hex (lower) of the normalized category and title joined by a pipe.</summary>
    public static string NormalizeFingerprint(string? category, string? title) =>
        FindingCorrelationKeyV1.NormalizeFingerprint(category, title);

    /// <summary>Normalized category+title key for fuzzy-only matching (ADR 0063 fallback).</summary>
    public static string NormalizeFuzzyKey(string? category, string? title) =>
        FindingCorrelationKeyV1.NormalizeFuzzyKey(category, title);
}
