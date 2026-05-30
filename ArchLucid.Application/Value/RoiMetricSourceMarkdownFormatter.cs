using System.Text;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Value;

public static class RoiMetricSourceMarkdownFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb, IReadOnlyList<RoiMetricSourceRow> rows)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(rows);

        sb.AppendLine("## ROI and cost source classification");
        sb.AppendLine();
        sb.AppendLine(
            "Every dollar or hours-saved line below carries an explicit source kind. "
            + "Treat **BenchmarkAssumption** and **NotEstimated** rows as illustrative — not realized customer outcomes.");
        sb.AppendLine();
        sb.AppendLine("| Metric | Value | Source | Citation |");
        sb.AppendLine("| --- | --- | --- | --- |");

        foreach (RoiMetricSourceRow row in rows)
        {
            sb.Append("| ");
            sb.Append(EscapeCell(row.DisplayLabel));
            sb.Append(" | ");
            sb.Append(EscapeCell(row.ValueSummary));
            sb.Append(" | **");
            sb.Append(row.SourceKind);
            sb.Append("** | ");
            sb.Append(EscapeCell(row.CitationDetail));
            sb.AppendLine(" |");
        }

        sb.AppendLine();
    }

    private static string EscapeCell(string value) =>
        value.Replace("|", "/");
}
