using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Compact sendable cover block aligned with UI Markdown and consulting DOCX cover (policy pack, gate, execution mode).
/// </summary>
public static class SendableExportCoverComposer
{
    /// <summary>WK-21 / M-172: policy-pack influence boundary mirrored from UI export honesty chip.</summary>
    public const string PolicyPackInfluenceHonestyLine =
        "Pack-mapped findings cite assigned policy rules. Typed engines may surface checklist coverage without pack-parameterized thresholds.";

    /// <summary>AS-058 / TB-1228: Lane B async semantic support honesty mirrored from UI export surfaces.</summary>
    public const string SemanticSupportBandLaneBAsyncHonestyLine =
        "Semantic support is async and may lag the sealed review. Lane B scores are not a commit gate.";

    /// <summary>V1 §2.8: disposition-aware headline vs per-system row semantics on sendable covers.</summary>
    public const string SponsorRoiNonSummingHeadlineLine =
        "Portfolio headline savings are disposition-aware and deduplicated by FindingId; per-system rows do not sum to the headline.";

    public const string PolicyPackNotStoredLine = "Policy pack was not stored.";

    public const string PolicyPackIdNotStoredLine = "Policy pack id was not stored.";

    public const string PolicyPackVersionNotStoredLine = "Policy pack version was not stored.";

    public const string ReviewIdNotStoredLine = "Review id was not stored.";

    public const string ReviewRecordStatusNotStoredLine = "Review record status was not stored.";

    public const string GateOutcomeNotStoredLine = "Gate outcome was not stored.";

    public static IReadOnlyList<string> RenderPlainTextLines(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        List<string> lines = [];

        lines.Add($"Policy pack: {FormatPolicyPackLine(input.RuleSetId, input.RuleSetVersion)}");

        FeasibilityVerdict? verdict = input.CoverageContext.Verdict;

        if (verdict is not null && DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            lines.Add(
                $"Gate outcome: {FormatVerdictKindLabel(verdict.Kind)} — treat exports as a reasoned decision record, not approval to proceed.");
        }
        else
        {
            lines.Add($"Gate outcome: {GateOutcomeNotStoredLine}");
        }

        lines.Add(
            $"Execution mode: {StructuralExecutionModeLabels.ToDisplayLabel(input.StructuralExecutionMode)}");

        lines.Add($"Policy influence: {PolicyPackInfluenceHonestyLine}");

        if (HasUncheckedDecisionGradeSemanticSupportBand(input))
        {
            lines.Add($"Semantic support: {SemanticSupportBandLaneBAsyncHonestyLine}");
        }

        lines.Add($"Sponsor ROI: {SponsorRoiNonSummingHeadlineLine}");

        return lines;
    }

    public static void AppendMarkdownSection(StringBuilder sb, CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(input);

        IReadOnlyList<string> lines = RenderPlainTextLines(input);

        if (lines.Count == 0)
        {
            return;
        }

        sb.AppendLine("## Sendable export cover");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(input.CoverageContext.RunId))
        {
            sb.AppendLine($"- **Review id:** `{input.CoverageContext.RunId.Trim()}`");
        }
        else
        {
            sb.AppendLine($"- **Review id:** {ReviewIdNotStoredLine}");
        }

        sb.AppendLine(
            FormatReviewRecordStatusMarkdownLine(input.ReviewRecordStatus));

        foreach (string line in lines)
        {
            sb.AppendLine($"- {line}");
        }

        sb.AppendLine();
        sb.AppendLine(
            "_Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings._");
        sb.AppendLine();
    }

    internal static string FormatPolicyPackLine(string? ruleSetId, string? ruleSetVersion)
    {
        string id = ruleSetId?.Trim() ?? string.Empty;
        string version = ruleSetVersion?.Trim() ?? string.Empty;

        if (id.Length > 0 && version.Length > 0)
        {
            return $"{id} @ {version}";
        }

        List<string> parts = [];

        if (id.Length == 0)
        {
            parts.Add(PolicyPackIdNotStoredLine);
        }

        if (version.Length == 0)
        {
            parts.Add(PolicyPackVersionNotStoredLine);
        }

        return parts.Count > 0 ? string.Join(' ', parts) : PolicyPackNotStoredLine;
    }

    internal static string FormatReviewRecordStatusMarkdownLine(string? reviewRecordStatus)
    {
        if (reviewRecordStatus is null)
        {
            return $"- **Review record status:** {ReviewRecordStatusNotStoredLine}";
        }

        string trimmed = reviewRecordStatus.Trim();

        return trimmed.Length > 0
            ? $"- **Review record status:** {trimmed}"
            : "- **Review record status:** Review record status was stored empty.";
    }

    private static string FormatVerdictKindLabel(FeasibilityVerdictKind kind) =>
        kind switch
        {
            FeasibilityVerdictKind.SoftInfeasible => "Soft infeasible",
            FeasibilityVerdictKind.HardInfeasible => "Hard infeasible",
            _ => kind.ToString(),
        };

    private static bool HasUncheckedDecisionGradeSemanticSupportBand(CareerExportCoverageHonestyInput input)
    {
        if (input.FindingsSnapshot?.Findings is not { Count: > 0 } findings)
        {
            return false;
        }

        foreach (Finding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            FindingSemanticSupportBand band =
                FirstValueReportSemanticSupportBandSummary.ResolveDecisionGradeSemanticSupportBand(
                    finding.SemanticSupportBand);

            if (band == FindingSemanticSupportBand.Unchecked)
            {
                return true;
            }
        }

        return false;
    }
}
