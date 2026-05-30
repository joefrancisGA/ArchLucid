using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Buyer-safe governance and audit summaries for <c>pilot proof-packet</c> folders.
/// </summary>
internal static class PilotProofPacketGovernanceArtifacts
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    internal static string BuildGovernanceOutcomeSummaryJson(string runId, string deltasJson, bool pilotStrictSatisfied)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        string disposition = ResolveProofDisposition(root, pilotStrictSatisfied);
        JsonElement? proof = TryGetProperty(root, "proofPackageCompleteness");

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.governance-outcome.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["governanceBlockingDecision"] = disposition == "PASS" ? "none" : "review_required",
            ["proofDisposition"] = disposition,
            ["publishingTier"] = ReadString(proof, "publishingTier") ?? "not_collected",
            ["proofSendability"] = ReadString(proof, "proofSendability") ?? "not_collected",
            ["evidenceCompleteness"] = ReadString(proof, "evidenceCompleteness") ?? "not_collected",
            ["sponsorProofReadiness"] = ReadString(proof, "sponsorProofReadiness") ?? "not_collected",
            ["agentOutputPilotStrictEvidenceSatisfied"] =
                ReadBool(proof, "agentOutputPilotStrictEvidenceSatisfied") ?? !pilotStrictSatisfied,
            ["policyPackCertificationClaim"] =
                "Policy-pack matches are advisory inputs only — not certification or attestation.",
            ["buyerSafeCaveat"] =
                disposition == "PASS"
                    ? "Governance posture is summarized from persisted run evidence; unresolved waivers may still require operator review."
                    : "Hold sponsor circulation until governance and proof completeness items in limitations.md are resolved.",
        };

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    internal static string BuildAuditEvidenceSummaryJson(
        string runId,
        IReadOnlyList<string> auditEventIds,
        string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        int auditRowCount = root.TryGetProperty("auditRowCount", out JsonElement countEl) && countEl.TryGetInt32(out int count)
            ? count
            : 0;

        bool auditTruncated = root.TryGetProperty("auditRowCountTruncated", out JsonElement truncatedEl)
                              && truncatedEl.ValueKind == JsonValueKind.True;

        string disposition = auditRowCount > 0 || auditTruncated ? "PASS" : "WARN";

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.audit-evidence-summary.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["disposition"] = disposition,
            ["auditRowCount"] = auditRowCount,
            ["auditRowCountTruncated"] = auditTruncated,
            ["sampleAuditEventIdCount"] = auditEventIds.Count,
            ["sampleAuditEventIds"] = auditEventIds.Take(10).ToArray(),
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

    internal static string BuildAuditEvidenceSummaryMarkdown(
        string runId,
        IReadOnlyList<string> auditEventIds,
        string deltasJson)
    {
        string json = BuildAuditEvidenceSummaryJson(runId, auditEventIds, deltasJson);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        string disposition = root.GetProperty("disposition").GetString() ?? "WARN";
        int auditRowCount = root.GetProperty("auditRowCount").GetInt32();
        bool truncated = root.GetProperty("auditRowCountTruncated").GetBoolean();
        int sampleCount = root.GetProperty("sampleAuditEventIdCount").GetInt32();

        StringBuilder sb = new();

        sb.AppendLine("# Audit evidence summary");
        sb.AppendLine();
        sb.AppendLine($"**Run id:** `{runId}`");
        sb.AppendLine($"**Disposition:** **{disposition}**");
        sb.AppendLine();
        sb.AppendLine($"**Audit rows linked to run:** {auditRowCount}{(truncated ? " (count capped — lower bound only)" : string.Empty)}");
        sb.AppendLine($"**Sample event ids included:** {sampleCount}");
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
                    sb.AppendLine($"- `{id}`");
            }

            sb.AppendLine();
        }

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    internal static string BuildScaleEnvelopeEvidenceJson(string runId, string deltasJson, string apiBaseRedacted)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        double? commitSeconds = null;

        if (root.TryGetProperty("timeToCommittedManifestTotalSeconds", out JsonElement secondsEl)
            && secondsEl.TryGetDouble(out double seconds))
        {
            commitSeconds = seconds;
        }

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.scale-envelope.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["apiBaseUrlRedacted"] = apiBaseRedacted,
            ["timeToCommittedManifestSeconds"] = commitSeconds,
            ["loadTestPerformed"] = false,
            ["multiRegionActiveActiveClaim"] = false,
            ["productionSlaClaim"] = false,
            ["disposition"] = commitSeconds is > 0 ? "PASS" : "WARN",
            ["nonClaims"] = new[]
            {
                "No multi-tenant load test was executed for this artifact.",
                "Timings reflect one run in one environment — not a production SLA.",
            },
        };

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    private static string ResolveProofDisposition(JsonElement root, bool pilotStrictSatisfied)
    {
        if (root.TryGetProperty("isDemoTenant", out JsonElement demoEl) && demoEl.ValueKind == JsonValueKind.True)
            return "HOLD";

        if (!pilotStrictSatisfied)
            return "HOLD";

        return "PASS";
    }

    private static JsonElement? TryGetProperty(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out JsonElement value))
            return value;

        return null;
    }

    private static string? ReadString(JsonElement? element, string propertyName)
    {
        if (element is null)
            return null;

        JsonElement value = element.Value;

        if (!value.TryGetProperty(propertyName, out JsonElement property))
            return null;

        return property.ValueKind == JsonValueKind.String ? property.GetString() : null;
    }

    private static bool? ReadBool(JsonElement? element, string propertyName)
    {
        if (element is null)
            return null;

        JsonElement value = element.Value;

        if (!value.TryGetProperty(propertyName, out JsonElement property))
            return null;

        return property.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            _ => null,
        };
    }
}
