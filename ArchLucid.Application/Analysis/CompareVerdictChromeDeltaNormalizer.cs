using ArchLucid.Application.Exports;
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

        NormalizeHonestyLinesInPlace(delta);
        NormalizeExecutionModeInPlace(delta);
        NormalizeRoiHeadlineInPlace(delta);
    }

    private static void NormalizeHonestyLinesInPlace(CompareVerdictChromeDelta delta)
    {
        delta.Wk21Line = NormalizeHonestyLineOrDefault(
            delta.Wk21Line,
            SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
        delta.NonSummingLine = NormalizeHonestyLineOrDefault(
            delta.NonSummingLine,
            SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
    }

    private static string NormalizeHonestyLineOrDefault(string? value, string defaultLine)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        return normalized ?? defaultLine;
    }

    private static void NormalizeExecutionModeInPlace(CompareVerdictChromeDelta delta)
    {
        if (delta.ExecutionMode is null)
            return;

        delta.ExecutionMode.AdvisoryParagraph =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(delta.ExecutionMode.AdvisoryParagraph);
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
