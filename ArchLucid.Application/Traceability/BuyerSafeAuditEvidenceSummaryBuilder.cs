using System.Globalization;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Traceability;

/// <summary>
///     Buyer-safe audit evidence summaries for traceability ZIP exports (TB-125 parity).
/// </summary>
public static class BuyerSafeAuditEvidenceSummaryBuilder
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    public static string BuildJson(string runId, IReadOnlyList<AuditEvent> audits, bool truncated)
    {
        Dictionary<string, int> categoryCounts = audits
            .GroupBy(static audit => audit.EventType ?? "Event type was not stored.")
            .ToDictionary(static group => group.Key, static group => group.Count(), StringComparer.Ordinal);

        List<string> sampleEventIds = audits
            .Select(static audit => audit.EventId.ToString("D", CultureInfo.InvariantCulture))
            .Take(10)
            .ToList();

        string disposition = ResolveDisposition(audits.Count, truncated);

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.traceability-bundle.audit-evidence-summary.v1",
            ["generatedUtc"] = TimeProvider.System.GetUtcNow().ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["disposition"] = disposition,
            ["auditRowCount"] = audits.Count,
            ["auditRowCountTruncated"] = truncated,
            ["eventTypeCounts"] = categoryCounts,
            ["sampleAuditEventIds"] = sampleEventIds,
            ["omittedFields"] = new[]
            {
                "raw audit payloads",
                "prompt text",
                "API keys",
                "customer secrets",
            },
            ["deeperLogsGuidance"] =
                "Request a redacted support bundle or scoped audit export through your operator contact.",
        };

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    public static string BuildMarkdown(string runId, IReadOnlyList<AuditEvent> audits, bool truncated)
    {
        string json = BuildJson(runId, audits, truncated);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        string disposition = root.GetProperty("disposition").GetString() ?? "Audit disposition was not stored.";
        int auditRowCount = root.GetProperty("auditRowCount").GetInt32();
        bool auditTruncated = root.GetProperty("auditRowCountTruncated").GetBoolean();

        StringBuilder sb = new();

        sb.AppendLine("# Audit evidence summary");
        sb.AppendLine();
        sb.AppendLine($"**Run id:** `{runId}`");
        sb.AppendLine($"**Disposition:** **{disposition}**");
        sb.AppendLine();
        sb.AppendLine(
            $"**Audit rows linked to run:** {auditRowCount}{(auditTruncated ? " (count capped — lower bound only)" : string.Empty)}");
        sb.AppendLine();
        sb.AppendLine("## Omitted from this export");
        sb.AppendLine();
        sb.AppendLine("- Raw audit payloads and `DataJson`");
        sb.AppendLine("- Prompt text and API keys");
        sb.AppendLine("- Customer secrets and PII");
        sb.AppendLine();
        sb.AppendLine("## Deeper logs");
        sb.AppendLine();
        sb.AppendLine(root.GetProperty("deeperLogsGuidance").GetString());
        sb.AppendLine();

        if (root.TryGetProperty("eventTypeCounts", out JsonElement countsEl)
            && countsEl.ValueKind == JsonValueKind.Object
            && countsEl.EnumerateObject().Any())
        {
            sb.AppendLine("## Event type counts");
            sb.AppendLine();

            foreach (JsonProperty property in countsEl.EnumerateObject().OrderBy(static property => property.Name, StringComparer.Ordinal))
            {
                sb.AppendLine($"- `{property.Name}`: {property.Value.GetInt32()}");
            }

            sb.AppendLine();
        }

        if (root.TryGetProperty("sampleAuditEventIds", out JsonElement idsEl)
            && idsEl.ValueKind == JsonValueKind.Array
            && idsEl.GetArrayLength() > 0)
        {
            sb.AppendLine("## Sample audit event ids");
            sb.AppendLine();

            foreach (JsonElement idEl in idsEl.EnumerateArray())
            {
                string? id = idEl.GetString();

                if (!string.IsNullOrWhiteSpace(id))
                {
                    sb.AppendLine($"- `{id}`");
                }
            }

            sb.AppendLine();
        }

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static string ResolveDisposition(int auditRowCount, bool truncated)
    {
        if (truncated)
            return "TRUNCATED";

        if (auditRowCount > 0)
            return "COLLECTED";

        return "NOT_COLLECTED";
    }
}
