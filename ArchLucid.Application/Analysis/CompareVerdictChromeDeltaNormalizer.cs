using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes compare verdict chrome deltas before E2E persist, rehydrate, and export formatting.
/// </summary>
internal static class CompareVerdictChromeDeltaNormalizer
{
    private const string GatePendingLabel = "Gate pending";
    private const string NoPackAssignmentRecorded = "No pack assignment recorded";

    internal static void NormalizeInPlace(CompareVerdictChromeDelta? delta)
    {
        if (delta is null)
            return;

        NormalizeHonestyLinesInPlace(delta);
        NormalizeGateOutcomeInPlace(delta);
        NormalizePackAssignmentInPlace(delta);
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

    private static void NormalizeGateOutcomeInPlace(CompareVerdictChromeDelta delta)
    {
        if (delta.GateOutcome is null)
            return;

        CompareVerdictChromeGateOutcomeDelta gate = delta.GateOutcome;
        gate.BaselineGateLabel = NormalizeGateLabelOrDefault(gate.BaselineGateLabel);
        gate.TargetGateLabel = NormalizeGateLabelOrDefault(gate.TargetGateLabel);
        gate.Changed = !string.Equals(gate.BaselineGateLabel, gate.TargetGateLabel, StringComparison.Ordinal);

        if (!gate.Changed
            && gate.BaselineGateLabel == GatePendingLabel
            && gate.TargetGateLabel == GatePendingLabel)
        {
            delta.GateOutcome = null;
        }
    }

    private static void NormalizePackAssignmentInPlace(CompareVerdictChromeDelta delta)
    {
        if (delta.PackAssignment is null)
            return;

        CompareVerdictChromePackAssignmentDelta pack = delta.PackAssignment;
        pack.BaselineSummaryLine = NormalizePackSummaryLineOrDefault(pack.BaselineSummaryLine);
        pack.TargetSummaryLine = NormalizePackSummaryLineOrDefault(pack.TargetSummaryLine);

        if (pack.BaselineSummaryLine == NoPackAssignmentRecorded
            && pack.TargetSummaryLine == NoPackAssignmentRecorded)
        {
            delta.PackAssignment = null;
            return;
        }

        pack.Changed = !string.Equals(pack.BaselineSummaryLine, pack.TargetSummaryLine, StringComparison.Ordinal);
    }

    private static void NormalizeExecutionModeInPlace(CompareVerdictChromeDelta delta)
    {
        if (delta.ExecutionMode is null)
            return;

        CompareVerdictChromeExecutionModeDelta mode = delta.ExecutionMode;
        mode.BaselineModeLabel = NormalizeRequiredDisplayLabel(mode.BaselineModeLabel);
        mode.TargetModeLabel = NormalizeRequiredDisplayLabel(mode.TargetModeLabel);
        mode.AdvisoryParagraph =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(mode.AdvisoryParagraph);
        mode.Changed = !string.Equals(mode.BaselineModeLabel, mode.TargetModeLabel, StringComparison.Ordinal);

        if (!mode.Changed)
            mode.AdvisoryParagraph = null;

        if (!mode.Changed
            && mode.BaselineModeLabel.Length == 0
            && mode.TargetModeLabel.Length == 0)
        {
            delta.ExecutionMode = null;
        }
    }

    private static string NormalizeGateLabelOrDefault(string value)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        return normalized ?? GatePendingLabel;
    }

    private static string NormalizePackSummaryLineOrDefault(string value)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        return normalized ?? NoPackAssignmentRecorded;
    }

    private static string NormalizeRequiredDisplayLabel(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

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
