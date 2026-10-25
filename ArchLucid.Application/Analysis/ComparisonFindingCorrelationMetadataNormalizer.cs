using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes finding-correlation metadata on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class ComparisonFindingCorrelationMetadataNormalizer
{
    private const string DefaultPrimaryCorrelationMethod = "PolicyRuleAndFingerprint";

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
    }

    internal static bool IsPersistedEmptyShell(ComparisonFindingCorrelationMetadata metadata) =>
        metadata.PolicyRuleMatchCount == 0
        && metadata.FuzzyMatchCount == 0
        && metadata.UnmatchedLeftCount == 0
        && metadata.UnmatchedRightCount == 0
        && metadata.HonestyNote.Length == 0
        && metadata.PrimaryCorrelationMethod == DefaultPrimaryCorrelationMethod;

    private static string NormalizePrimaryCorrelationMethod(string value) =>
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value) ?? DefaultPrimaryCorrelationMethod;

    private static int ClampCount(int value) => value < 0 ? 0 : value;
}
