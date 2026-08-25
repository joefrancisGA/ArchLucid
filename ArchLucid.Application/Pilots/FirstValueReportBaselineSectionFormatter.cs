using System.Text;

namespace ArchLucid.Application.Pilots;

/// <summary>Qualitative baseline placeholder table for the first-value report.</summary>
public static class FirstValueReportBaselineSectionFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb)
    {
        ArgumentNullException.ThrowIfNull(sb);

        sb.AppendLine("## Qualitative baseline (operator-filled)");
        sb.AppendLine();
        sb.AppendLine(
            "Use this table for the qualitative metrics ArchLucid cannot derive on its own. The numeric metrics (time-to-commit, findings counts, audit rows, LLM calls) are now in the **Computed deltas** section above.");
        sb.AppendLine();
        sb.AppendLine("| Pilot metric (see PILOT_ROI_MODEL.md) | Baseline (before) | During pilot | Notes |");
        sb.AppendLine("| --- | --- | --- | --- |");
        sb.AppendLine("| Time to reviewable artifact package |  |  |  |");
        sb.AppendLine("| Manual preparation effort |  |  |  |");
        sb.AppendLine("| Decision traceability (qualitative) |  |  |  |");
        sb.AppendLine("| Reviewer / sponsor confidence |  |  |  |");
        sb.AppendLine();
    }
}
