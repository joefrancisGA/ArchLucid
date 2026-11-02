using System.Globalization;
using System.Text;

namespace ArchLucid.Core.GoldenCorpus;

/// <summary>Formats golden-cohort drift output as Markdown for CI / <c>docs/quality</c> consumers.</summary>
public static class GoldenCohortDriftMarkdown
{
    public static string BuildReport(
        DateTimeOffset generatedUtc,
        IReadOnlyList<GoldenCohortDriftRow> rows,
        string preamble)
    {
        StringBuilder sb = new();
        sb.AppendLine("# Golden cohort drift report");
        sb.AppendLine();
        sb.AppendLine($"**Generated (UTC):** {generatedUtc:O}");
        sb.AppendLine();
        sb.AppendLine(preamble.Trim());
        sb.AppendLine();

        if (rows.Count == 0)
        {
            sb.AppendLine("_No rows evaluated._");

            return sb.ToString();
        }

        sb.AppendLine(
            "| Item | Model / prompt | Quality status | Faithfulness | Estimated LLM cost | Budget status | Expected SHA | Actual SHA | SHA match | Expected categories | Actual categories | Category match |");
        sb.AppendLine(
            "|------|----------------|----------------|--------------|--------------------|---------------|--------------|------------|-----------|---------------------|-------------------|----------------|");

        foreach (GoldenCohortDriftRow row in rows)
        {
            string modelPrompt = string.IsNullOrWhiteSpace(row.ModelPromptLabel)
                ? "-"
                : Escape(row.ModelPromptLabel);
            string qualityStatus = string.IsNullOrWhiteSpace(row.QualityStatus)
                ? "-"
                : Escape(row.QualityStatus);
            string faithfulness = row.FaithfulnessSupportRatio is { } ratio
                ? ratio.ToString("0.0000", CultureInfo.InvariantCulture)
                : "-";
            string cost = row.EstimatedLlmCostUsd is { } estimatedCost
                ? $"USD {estimatedCost.ToString("0.0000", CultureInfo.InvariantCulture)}"
                : "-";
            string budgetStatus = string.IsNullOrWhiteSpace(row.BudgetStatus)
                ? "-"
                : Escape(row.BudgetStatus);

            sb.AppendLine(
                $"| {Escape(row.ItemId)} | {modelPrompt} | {qualityStatus} | {faithfulness} | {cost} | {budgetStatus} | "
                + $"`{Escape(row.ExpectedSha)}` | `{Escape(row.ActualSha)}` | {row.ShaMatches} | "
                + $"{Escape(row.ExpectedCategories)} | {Escape(row.ActualCategories)} | {row.CategoryMatches} |");
        }

        sb.AppendLine();

        int mismatches = rows.Count(r => !r.ShaMatches || !r.CategoryMatches);
        sb.AppendLine(
            $"**Summary:** {mismatches.ToString(CultureInfo.InvariantCulture)} / {rows.Count.ToString(CultureInfo.InvariantCulture)} items drifted.");

        return sb.ToString();
    }

    /// <summary>
    ///     One row per cohort item so FluentAssertions <c>MaxLines</c> can show all 20 SHA actuals
    ///     on nightly failure (the full markdown report is truncated around seven rows).
    /// </summary>
    public static string BuildCompactShaTable(IReadOnlyList<GoldenCohortDriftRow> rows)
    {
        if (rows is null)
            throw new ArgumentNullException(nameof(rows));

        StringBuilder sb = new();
        sb.AppendLine("item\texpectedSha\tactualSha\tshaMatch\tcategoryMatch");

        foreach (GoldenCohortDriftRow row in rows)
        {
            sb.Append(row.ItemId);
            sb.Append('\t');
            sb.Append(row.ExpectedSha);
            sb.Append('\t');
            sb.Append(row.ActualSha);
            sb.Append('\t');
            sb.Append(row.ShaMatches);
            sb.Append('\t');
            sb.AppendLine(row.CategoryMatches.ToString());
        }

        int shaMismatches = rows.Count(static r => !r.ShaMatches);
        int categoryMismatches = rows.Count(static r => !r.CategoryMatches);
        sb.Append("Summary: ");
        sb.Append(shaMismatches.ToString(CultureInfo.InvariantCulture));
        sb.Append('/');
        sb.Append(rows.Count.ToString(CultureInfo.InvariantCulture));
        sb.Append(" SHA mismatch, ");
        sb.Append(categoryMismatches.ToString(CultureInfo.InvariantCulture));
        sb.Append('/');
        sb.Append(rows.Count.ToString(CultureInfo.InvariantCulture));
        sb.AppendLine(" category mismatch.");

        return sb.ToString();
    }

    private static string Escape(string value) => value.Replace("|", "\\|", StringComparison.Ordinal);
}

/// <summary>One evaluated cohort row for drift reporting.</summary>
public sealed record GoldenCohortDriftRow(
    string ItemId,
    string ExpectedSha,
    string ActualSha,
    bool ShaMatches,
    string ExpectedCategories,
    string ActualCategories,
    bool CategoryMatches,
    string? ModelPromptLabel = null,
    string? QualityStatus = null,
    double? FaithfulnessSupportRatio = null,
    decimal? EstimatedLlmCostUsd = null,
    string? BudgetStatus = null);
