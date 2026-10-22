using System.Text;

namespace ArchLucid.Application.Exports;

/// <summary>Formats architect restatements for sponsor/receipt exports with ADR 0078 honesty labels (LP-15).</summary>
public static class FindingArchitectRestatementExportComposer
{
    public const string TrailBackedHonestyLabel =
        "Operator restatement (disposition audit trail) — not sealed engine prose.";

    public const string NotTrailBackedHonestyLabel =
        "Operator restatement — not sealed engine prose.";

    public static string ResolveHonestyLabel(bool isTrailBacked) =>
        isTrailBacked ? TrailBackedHonestyLabel : NotTrailBackedHonestyLabel;

    public static void AppendMarkdownSection(StringBuilder sb, IReadOnlyList<FindingArchitectRestatementExportRow> rows)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(rows);

        if (rows.Count == 0)
        {
            return;
        }

        sb.AppendLine("## Human judgment (architect restatements)");
        sb.AppendLine();
        sb.AppendLine(
            "> These sentences are operator wording on the disposition audit trail. They do not rewrite sealed engine finding text.");
        sb.AppendLine();

        foreach (FindingArchitectRestatementExportRow row in rows)
        {
            string title = string.IsNullOrWhiteSpace(row.FindingTitle) ? row.FindingId : row.FindingTitle.Trim();
            sb.AppendLine($"### {title}");
            sb.AppendLine();
            sb.AppendLine($"_{ResolveHonestyLabel(row.IsTrailBacked)}_");
            sb.AppendLine();
            sb.AppendLine(row.Restatement.Trim());
            sb.AppendLine();
            sb.AppendLine($"Recorded (UTC): {row.OccurredAtUtc:yyyy-MM-dd HH:mm:ss} Z");
            sb.AppendLine();
        }
    }
}
