using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

/// <summary>Writes ROI source artifacts for <c>archlucid pilot proof-packet</c>.</summary>
internal static class PilotProofPacketRoiArtifacts
{
    private static readonly UTF8Encoding Utf8NoBom = new(false);

    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    internal static async Task WriteAsync(string outputDirectory, string deltasJson, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);
        ArgumentException.ThrowIfNullOrWhiteSpace(deltasJson);

        IReadOnlyList<RoiMetricSourceRow> rows = TryParseRoiMetricSources(deltasJson);

        if (rows.Count == 0)
            return;

        string mdPath = Path.Combine(outputDirectory, "roi-metric-sources.md");
        StringBuilder sb = new();
        sb.AppendLine("# ROI metric sources");
        sb.AppendLine();
        AppendFreshnessSection(sb, deltasJson);
        AppendRoiMarkdownSection(sb, rows);
        await File.WriteAllTextAsync(mdPath, sb.ToString(), Utf8NoBom, cancellationToken);

        string jsonPath = Path.Combine(outputDirectory, "roi-metric-sources.json");
        string json = JsonSerializer.Serialize(
            new
            {
                schema = "archlucid.proof-packet.roi-metric-sources.v1",
                rows,
            },
            JsonWrite);
        await File.WriteAllTextAsync(jsonPath, json, Utf8NoBom, cancellationToken);
    }

    internal static bool TryResolvePilotStrictSatisfied(string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (!root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
            return true;

        if (proof.TryGetProperty("agentOutputPilotStrictEvidenceSatisfied", out JsonElement strict)
            && strict.ValueKind == JsonValueKind.False)
            return false;

        return true;
    }

    internal static IReadOnlyList<RoiMetricSourceRow> TryParseRoiMetricSources(string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (!root.TryGetProperty("roiMetricSources", out JsonElement sources)
            || sources.ValueKind != JsonValueKind.Array)
            return [];

        List<RoiMetricSourceRow> rows = [];

        foreach (JsonElement row in sources.EnumerateArray())
        {
            string? metricKey = row.TryGetProperty("metricKey", out JsonElement keyEl) ? keyEl.GetString() : null;
            string? label = row.TryGetProperty("label", out JsonElement labelEl) ? labelEl.GetString() : null;
            string? value = row.TryGetProperty("value", out JsonElement valueEl) ? valueEl.GetString() : null;
            string? citation = row.TryGetProperty("citation", out JsonElement citeEl) ? citeEl.GetString() : null;

            if (string.IsNullOrWhiteSpace(metricKey) || string.IsNullOrWhiteSpace(label))
                continue;

            RoiMetricSourceKind kind = RoiMetricSourceKind.BenchmarkAssumption;

            if (row.TryGetProperty("sourceKind", out JsonElement kindEl))
            {
                string? kindText = kindEl.GetString();

                if (!string.IsNullOrWhiteSpace(kindText)
                    && Enum.TryParse(kindText, ignoreCase: true, out RoiMetricSourceKind parsed))
                    kind = parsed;
            }

            rows.Add(new RoiMetricSourceRow(metricKey, label, value ?? string.Empty, kind, citation ?? string.Empty));
        }

        return rows;
    }

    private static void AppendFreshnessSection(StringBuilder sb, string deltasJson)
    {
        string disposition = PilotProofPacketRoiFreshnessEvaluator.ResolveDisposition(deltasJson, DateTime.UtcNow);

        sb.AppendLine($"**ROI source freshness disposition:** **{disposition}**");
        sb.AppendLine();

        string line = PilotProofPacketRoiFreshnessEvaluator.BuildLimitationsLine(deltasJson, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(line))
        {
            sb.AppendLine($"- {line}");
            sb.AppendLine();
        }
    }

    private static void AppendRoiMarkdownSection(StringBuilder sb, IReadOnlyList<RoiMetricSourceRow> rows)
    {
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
            sb.Append(row.DisplayLabel.Replace("|", "/", StringComparison.Ordinal));
            sb.Append(" | ");
            sb.Append(row.ValueSummary.Replace("|", "/", StringComparison.Ordinal));
            sb.Append(" | **");
            sb.Append(row.SourceKind);
            sb.Append("** | ");
            sb.Append(row.CitationDetail.Replace("|", "/", StringComparison.Ordinal));
            sb.AppendLine(" |");
        }

        sb.AppendLine();
    }
}
