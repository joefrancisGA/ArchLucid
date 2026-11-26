using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

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

        return FindingCorrelationKeyV1.TryBuildCrossReviewPolicyKey(finding.PolicyRuleId, finding.Category, finding.Message);
    }

    /// <summary>Normalized category+message fingerprint used for fuzzy and policy-rule correlation.</summary>
    public static string NormalizeFingerprint(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return FindingCorrelationKeyV1.NormalizeFingerprint(finding.Category, finding.Message);
    }

    /// <summary>Normalized category+message key for fuzzy-only matching.</summary>
    public static string NormalizeFuzzyKey(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return FindingCorrelationKeyV1.NormalizeFuzzyKey(finding.Category, finding.Message);
    }
}
