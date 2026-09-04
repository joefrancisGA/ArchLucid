using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Reuses the same coverage honesty language as <c>sponsor-review-coverage-honesty.ts</c> for sponsor PDF/DOCX exports (CD-15).
/// </summary>
public static class SponsorReviewCoverageHonestyMarkdownFormatter
{
    private const string QuietEnginesBody =
        "Trust-boundary, privileged-access, and external-exposure engines did not run because this graph has no Actor nodes. IaC uploads alone do not create actors.";

    public static bool Applies(SponsorReviewCoverageHonestyContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        FeasibilityVerdict? verdict = context.Verdict;

        if (verdict is not null && DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            return true;
        }

        bool showQuietEngines = context.AnalysisStagesComplete && context.ActorNodeCount == 0;
        int skippedMustCount = CountSkippedMustQuestionKeys(verdict?.TransparencyTrail);

        return showQuietEngines || skippedMustCount > 0;
    }

    public static void AppendMarkdownSection(StringBuilder sb, SponsorReviewCoverageHonestyContext context)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(context);

        if (!Applies(context))
        {
            return;
        }

        string runId = context.RunId.Trim();
        FeasibilityVerdict? verdict = context.Verdict;

        sb.AppendLine("## Architecture package honesty");
        sb.AppendLine();
        sb.AppendLine(
            $"> Sponsor KPIs for review `{runId}` are **not** an all-clear bill of health. Open the architecture package in ArchLucid before steering or procurement use.");
        sb.AppendLine();

        if (verdict is not null && DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            sb.AppendLine(
                $"- **Feasibility verdict:** {FormatVerdictKindLabel(verdict.Kind)} — treat exports as a reasoned decision record, not approval to proceed.");
        }

        if (context.AnalysisStagesComplete && context.ActorNodeCount == 0)
        {
            sb.AppendLine($"- **Coverage:** {QuietEnginesBody}");
        }

        IReadOnlyList<string> skippedMustKeys = ListSkippedMustQuestionKeys(verdict?.TransparencyTrail);

        if (skippedMustKeys.Count > 0)
        {
            sb.AppendLine($"- **Skipped required questions:** {string.Join(", ", skippedMustKeys)}");
        }

        sb.AppendLine();
    }

    public static IReadOnlyList<string> RenderPlainTextLines(SponsorReviewCoverageHonestyContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (!Applies(context))
        {
            return [];
        }

        List<string> lines =
        [
            "Architecture package honesty",
            $"Sponsor KPIs for review {context.RunId.Trim()} are not an all-clear bill of health. Open the architecture package in ArchLucid before steering or procurement use.",
        ];

        FeasibilityVerdict? verdict = context.Verdict;

        if (verdict is not null && DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            lines.Add(
                $"Feasibility verdict: {FormatVerdictKindLabel(verdict.Kind)} — treat exports as a reasoned decision record, not approval to proceed.");
        }

        if (context.AnalysisStagesComplete && context.ActorNodeCount == 0)
        {
            lines.Add($"Coverage: {QuietEnginesBody}");
        }

        IReadOnlyList<string> skippedMustKeys = ListSkippedMustQuestionKeys(verdict?.TransparencyTrail);

        if (skippedMustKeys.Count > 0)
        {
            lines.Add($"Skipped required questions: {string.Join(", ", skippedMustKeys)}");
        }

        return lines;
    }

    private static string FormatVerdictKindLabel(FeasibilityVerdictKind kind) =>
        kind switch
        {
            FeasibilityVerdictKind.SoftInfeasible => "Soft infeasible",
            FeasibilityVerdictKind.HardInfeasible => "Hard infeasible",
            _ => kind.ToString(),
        };

    private static int CountSkippedMustQuestionKeys(TransparencyTrail? trail)
    {
        return ListSkippedMustQuestionKeys(trail).Count;
    }

    private static IReadOnlyList<string> ListSkippedMustQuestionKeys(TransparencyTrail? trail)
    {
        if (trail is null)
        {
            return [];
        }

        List<string> keys = [];

        foreach (SkippedQuestionTrailEntry skipped in trail.Skipped)
        {
            if (skipped.Tier != ElicitationQuestionTier.Must)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(skipped.QuestionKey))
            {
                continue;
            }

            keys.Add(skipped.QuestionKey.Trim());
        }

        return keys;
    }
}
