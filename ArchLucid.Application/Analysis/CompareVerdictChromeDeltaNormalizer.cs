using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes compare verdict chrome deltas before E2E persist, rehydrate, and export formatting.
/// </summary>
internal static class CompareVerdictChromeDeltaNormalizer
{
    internal static void NormalizeInPlace(CompareVerdictChromeDelta? delta)
    {
        if (delta is null)
            return;

        NormalizeRoiHeadlineInPlace(delta);
    }

    private static void NormalizeRoiHeadlineInPlace(CompareVerdictChromeDelta delta)
    {
        if (delta.RoiHeadline is null)
            return;

        CompareVerdictChromeRoiHeadlineDelta roi = delta.RoiHeadline;
        roi.BaselineSavingsLabel =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(roi.BaselineSavingsLabel);
        roi.TargetSavingsLabel =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(roi.TargetSavingsLabel);

        if (roi.BaselineSavingsLabel is null && roi.TargetSavingsLabel is null)
            delta.RoiHeadline = null;
    }
}
