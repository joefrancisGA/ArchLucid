using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

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

    /// <summary>Build a scoped canonical candidate from authorized source data without altering the legacy key.</summary>
    public static string? TryBuildCanonicalKey(ArchitectureFinding finding, ProjectScopeKey? project, string? canonicalAssetKey)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return FindingCorrelationKeyV2.TryBuild(project, canonicalAssetKey, finding.PolicyRuleId, finding.Category, finding.Message);
    }

    /// <summary>Rebuild a canonical candidate only if the original source row reproduces its exact legacy policy key.</summary>
    public static string? TryRebuildCanonicalKeyFromLegacy(
        ArchitectureFinding finding, ProjectScopeKey? project, string? canonicalAssetKey, string? legacyPolicyKey)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (string.IsNullOrWhiteSpace(finding.PolicyRuleId)
            || legacyPolicyKey is null
            || !string.Equals(legacyPolicyKey, TryBuildDedupeKey(finding), StringComparison.Ordinal))
        {
            return null;
        }

        return TryBuildCanonicalKey(finding, project, canonicalAssetKey);
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
