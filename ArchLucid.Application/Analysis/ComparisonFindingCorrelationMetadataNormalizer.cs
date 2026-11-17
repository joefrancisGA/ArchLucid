using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes finding-correlation metadata on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class ComparisonFindingCorrelationMetadataNormalizer
{
    private const string DefaultPrimaryCorrelationMethod = "PolicyRuleAndFingerprint";

    private const string PolicyMatchHonestyNote =
        "Finding pairs matched on policy rule id and normalized fingerprint when both sides exposed a policy rule.";

    private const string NoMatchHonestyNote =
        "No finding pairs matched. Unmatched findings are not treated as the same finding across the two runs.";

    private static readonly HashSet<string> KnownPrimaryCorrelationMethods = new(StringComparer.Ordinal)
    {
        DefaultPrimaryCorrelationMethod,
        nameof(FindingCorrelationMethod.MessageCategoryFuzzy),
        "Mixed",
    };

    internal static void NormalizeInPlace(ComparisonFindingCorrelationMetadata? metadata)
    {
        if (metadata is null)
            return;

        metadata.PrimaryCorrelationMethod = NormalizePrimaryCorrelationMethod(metadata.PrimaryCorrelationMethod);
        metadata.HonestyNote =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(metadata.HonestyNote) ?? string.Empty;

        metadata.PolicyRuleMatchCount = ClampCount(metadata.PolicyRuleMatchCount);
        metadata.FuzzyMatchCount = ClampCount(metadata.FuzzyMatchCount);
        metadata.UnmatchedLeftCount = ClampCount(metadata.UnmatchedLeftCount);
        metadata.UnmatchedRightCount = ClampCount(metadata.UnmatchedRightCount);
        ApplyNoMatchHonesty(metadata);
    }

    internal static bool IsPersistedEmptyShell(ComparisonFindingCorrelationMetadata metadata) =>
        metadata.PolicyRuleMatchCount == 0
        && metadata.FuzzyMatchCount == 0
        && metadata.UnmatchedLeftCount == 0
        && metadata.UnmatchedRightCount == 0
        && metadata.HonestyNote.Length == 0
        && metadata.PrimaryCorrelationMethod == DefaultPrimaryCorrelationMethod;

    private static string NormalizePrimaryCorrelationMethod(string value)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        if (normalized is null)
            return DefaultPrimaryCorrelationMethod;

        return KnownPrimaryCorrelationMethods.Contains(normalized)
            ? normalized
            : DefaultPrimaryCorrelationMethod;
    }

    private static int ClampCount(int value) => value < 0 ? 0 : value;

    private static void ApplyNoMatchHonesty(ComparisonFindingCorrelationMetadata metadata)
    {
        if (metadata.PolicyRuleMatchCount != 0 || metadata.FuzzyMatchCount != 0)
            return;

        if (!string.Equals(metadata.HonestyNote, PolicyMatchHonestyNote, StringComparison.Ordinal))
            return;

        metadata.HonestyNote = NoMatchHonestyNote;
    }
}
