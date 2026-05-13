using System.Globalization;
using System.Text;

using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Value;

/// <summary>Markdown table for <see cref="ValueReportSnapshot"/> — reuses DOCX numbers; dates via <see cref="ExportFormatterService"/>.</summary>
public sealed class ValueReportSnapshotMarkdownFormatter(ExportFormatterService exportFormatter)
{
    private readonly ExportFormatterService _exportFormatter =
        exportFormatter ?? throw new ArgumentNullException(nameof(exportFormatter));

    /// <summary>Emits ROI_MODEL-aligned headline metrics already computed in <see cref="ValueReportBuilder"/>.</summary>
    public string Format(ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        StringBuilder sb = new();
        sb.AppendLine("# Value report snapshot (tenant window)");
        sb.AppendLine();
        _exportFormatter.AppendMarkdownTwoColumnTableStart(sb, "Metric", "Value");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Period (UTC) | {_exportFormatter.FormatIso8601Utc(snapshot.PeriodFromUtc)} → {_exportFormatter.FormatIso8601Utc(snapshot.PeriodToUtc)} |");
        sb.AppendLine($"| Runs completed | {snapshot.RunsCompletedCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Manifests committed | {snapshot.ManifestsCommittedCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Governance events | {snapshot.GovernanceEventsHandledCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Drift alerts | {snapshot.DriftAlertEventsCaughtCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Estimated architect hours saved (total) | {snapshot.EstimatedTotalArchitectHoursSaved.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Annualized hours value (USD) | {snapshot.AnnualizedHoursValueUsd.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Annualized LLM cost (USD) | {snapshot.AnnualizedLlmCostUsd.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine(
            $"| Baseline annual subscription + ops (USD, ROI model) | {snapshot.BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Net annualized vs baseline (USD) | {snapshot.NetAnnualizedValueVersusRoiBaselineUsd.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| ROI vs baseline (%) | {snapshot.RoiAnnualizedPercentVersusRoiBaseline.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine();
        sb.AppendLine($"_LLM cost note:_ {snapshot.EstimatedLlmCostMethodologyNote}");

        return sb.ToString();
    }
}
