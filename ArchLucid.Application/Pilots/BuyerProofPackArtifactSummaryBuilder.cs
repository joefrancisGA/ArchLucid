using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Application.Pilots;

internal static class BuyerProofPackArtifactSummaryBuilder
{
    internal static string Build(string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;
        StringBuilder builder = new();

        builder.AppendLine("# Artifact and proof summary (compact)");
        builder.AppendLine();
        builder.AppendLine("Generated from pilot-run-deltas — not a substitute for the full first-value report.");
        builder.AppendLine();

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            builder.AppendLine("## Proof-package completeness (API checklist)");
            builder.AppendLine();
            builder.AppendLine("| Field | Value |");
            builder.AppendLine("| --- | --- |");

            foreach (JsonProperty property in proof.EnumerateObject().OrderBy(static pair => pair.Name, StringComparer.Ordinal))
            {
                builder.Append("| `");
                builder.Append(property.Name);
                builder.Append("` | ");
                builder.Append(SummarizeJsonElement(property.Value));
                builder.AppendLine(" |");
            }

            builder.AppendLine();
        }

        builder.AppendLine("## Findings by severity (counts)");
        builder.AppendLine();

        if (root.TryGetProperty("findingsBySeverity", out JsonElement severityRows)
            && severityRows.ValueKind == JsonValueKind.Array)
        {
            builder.AppendLine("| Severity | Count |");
            builder.AppendLine("| --- | ---: |");

            foreach (JsonElement row in severityRows.EnumerateArray())
            {
                string severity = row.TryGetProperty("severity", out JsonElement severityElement)
                    ? severityElement.GetString() ?? string.Empty
                    : string.Empty;
                string count = row.TryGetProperty("count", out JsonElement countElement)
                    ? countElement.GetInt32().ToString(CultureInfo.InvariantCulture)
                    : string.Empty;

                builder.AppendLine(CultureInfo.InvariantCulture, $"| {severity} | {count} |");
            }
        }
        else
        {
            builder.AppendLine("_(No severity buckets in response.)_");
        }

        builder.AppendLine();

        if (root.TryGetProperty("governedFindingCoverage", out JsonElement coverage)
            && coverage.ValueKind == JsonValueKind.Object
            && coverage.TryGetProperty("isAvailable", out JsonElement availableElement)
            && availableElement.ValueKind == JsonValueKind.True)
        {
            builder.AppendLine("## Governed finding coverage");
            builder.AppendLine();
            builder.AppendLine("| Metric | Value |");
            builder.AppendLine("| --- | ---: |");
            AppendCoverageRow(builder, coverage, "totalDecisionGradeCount", "Total decision-grade findings");
            AppendCoverageRow(builder, coverage, "totalChecklistCoverageCount", "Checklist coverage findings");
            AppendCoverageRow(builder, coverage, "governedCount", "Governance-blocking");
            AppendCoverageRow(builder, coverage, "advisoryCount", "Advisory-only");
            AppendCoverageRow(builder, coverage, "withPolicyRuleCount", "With policy rule");
            AppendCoverageRow(builder, coverage, "withEvidenceRefsCount", "With evidence refs");

            if (coverage.TryGetProperty("governedPercentage", out JsonElement percentageElement)
                && percentageElement.ValueKind == JsonValueKind.Number)
            {
                builder.AppendLine(CultureInfo.InvariantCulture,
                    $"| Governed share | {percentageElement.GetDouble():F1}% |");
            }

            builder.AppendLine();
        }

        return builder.ToString();
    }

    private static void AppendCoverageRow(StringBuilder builder, JsonElement coverage, string propertyName, string label)
    {
        if (!coverage.TryGetProperty(propertyName, out JsonElement valueElement)
            || valueElement.ValueKind != JsonValueKind.Number)
            return;

        builder.AppendLine(CultureInfo.InvariantCulture, $"| {label} | {valueElement.GetInt32()} |");
    }

    private static string SummarizeJsonElement(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.String => "`" + element.GetString() + "`",
        JsonValueKind.Number => element.GetRawText(),
        JsonValueKind.True => "`true`",
        JsonValueKind.False => "`false`",
        JsonValueKind.Null => "`null`",
        _ => "`(complex)`",
    };
}
