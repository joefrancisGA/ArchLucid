using System.Text;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Markdown writer for internal gate vs human novelty calibration (DX-67).</summary>
public static class InsightDensityGateHumanCalibrationMarkdown
{
    public const string ClaimBoundary =
        "Internal engineering only — human novelty rates are operator marks on Decision-grade rows, not a named-model beat; sample floor 5; not SOC 2 Type II.";

    public static string Write(IReadOnlyList<InsightDensityGateHumanCalibrationRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);

        StringBuilder builder = new();
        builder.AppendLine("# Insight density gate vs human novelty calibration");
        builder.AppendLine();
        builder.AppendLine($"<!-- claimBoundary: {ClaimBoundary} -->");
        builder.AppendLine();
        builder.AppendLine("| EngineType | FindingCount | DecisionGradeCount | MedianScore | DidNotThinkOfThatCount | NoveltyRate | Residual |");
        builder.AppendLine("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");

        foreach (InsightDensityGateHumanCalibrationRow row in rows)
        {
            builder.Append('|')
                .Append(row.EngineType)
                .Append("| ")
                .Append(row.FindingCount)
                .Append(" | ")
                .Append(row.DecisionGradeCount)
                .Append(" | ")
                .Append(row.MedianScore)
                .Append(" | ")
                .Append(row.DidNotThinkOfThatCount)
                .Append(" | ")
                .Append(row.NoveltyRate?.ToString("0.###") ?? "—")
                .Append(" | ")
                .Append(row.Residual?.ToString("0.###") ?? "—")
                .AppendLine(" |");
        }

        return builder.ToString();
    }
}
