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
    }

    private static string NormalizePrimaryCorrelationMethod(string value) =>
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value) ?? DefaultPrimaryCorrelationMethod;
}
