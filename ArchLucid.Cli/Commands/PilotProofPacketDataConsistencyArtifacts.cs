using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Buyer-safe data-consistency summary for sponsor-handoff proof packets (orphan / completeness holds).
/// </summary>
internal static class PilotProofPacketDataConsistencyArtifacts
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    internal static string BuildSummaryJson(string runId, string deltasJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(deltasJson);

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        List<string> holdReasons = [];
        List<string> warnReasons = [];

        EvaluateProofCompleteness(root, holdReasons, warnReasons);
        EvaluateRoiSources(root, holdReasons, warnReasons, deltasJson);
        EvaluateDemoTenant(root, holdReasons, warnReasons);

        string disposition = holdReasons.Count > 0 ? "HOLD" : warnReasons.Count > 0 ? "WARN" : "PASS";

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.data-consistency-summary.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["disposition"] = disposition,
            ["holdReasons"] = holdReasons.ToArray(),
            ["warnReasons"] = warnReasons.ToArray(),
            ["sponsorHandoffBlocked"] = disposition == "HOLD",
            ["remediationGuidance"] =
                disposition == "HOLD"
                    ? "Resolve holdReasons before external sponsor circulation. Run collect-data-consistency-readiness.ps1 for full tenant probes."
                    : disposition == "WARN"
                        ? "Review warnReasons; sponsor send may proceed with caveats in limitations.md."
                        : "No structural data-consistency holds detected from persisted run evidence.",
            ["autoQuarantineEnabled"] = false,
        };

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    internal static string BuildSummaryMarkdown(string runId, string deltasJson)
    {
        string json = BuildSummaryJson(runId, deltasJson);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        string disposition = root.GetProperty("disposition").GetString() ?? "WARN";
        StringBuilder sb = new();

        sb.AppendLine("# Data consistency summary");
        sb.AppendLine();
        sb.AppendLine($"**Run id:** `{runId}`");
        sb.AppendLine($"**Disposition:** **{disposition}**");
        sb.AppendLine();
        sb.AppendLine(root.GetProperty("remediationGuidance").GetString());
        sb.AppendLine();

        AppendReasonSection(sb, "Hold reasons", root, "holdReasons");
        AppendReasonSection(sb, "Warnings", root, "warnReasons");

        sb.AppendLine("## Notes");
        sb.AppendLine();
        sb.AppendLine("- This summary evaluates persisted run evidence only — not full-tenant orphan probes.");
        sb.AppendLine("- For tenant-wide consistency probes, run `collect-data-consistency-readiness.ps1` during proof collection.");
        sb.AppendLine("- Production auto-quarantine remains off unless explicitly configured.");

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static void AppendReasonSection(StringBuilder sb, string title, JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement reasonsEl)
            || reasonsEl.ValueKind != JsonValueKind.Array
            || reasonsEl.GetArrayLength() == 0)
        {
            return;
        }

        sb.AppendLine($"## {title}");
        sb.AppendLine();

        foreach (JsonElement reason in reasonsEl.EnumerateArray())
        {
            string? text = reason.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                sb.AppendLine($"- {text}");
        }

        sb.AppendLine();
    }

    private static void EvaluateProofCompleteness(JsonElement root, List<string> holdReasons, List<string> warnReasons)
    {
        if (!root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
            return;

        if (proof.TryGetProperty("runInCommittedStatus", out JsonElement committedEl)
            && committedEl.ValueKind == JsonValueKind.False)
        {
            holdReasons.Add("Run is not in Committed status — sponsor handoff requires a committed manifest.");
        }

        if (proof.TryGetProperty("committedManifestPresent", out JsonElement manifestEl)
            && manifestEl.ValueKind == JsonValueKind.False)
        {
            holdReasons.Add("Committed golden manifest is missing on the run aggregate.");
        }

        if (proof.TryGetProperty("artifactDescriptorCountResolved", out JsonElement artifactResolvedEl)
            && artifactResolvedEl.ValueKind == JsonValueKind.True
            && proof.TryGetProperty("artifactDescriptorCount", out JsonElement countEl)
            && countEl.TryGetInt32(out int count)
            && count == 0)
        {
            warnReasons.Add("Artifact descriptor count resolved to zero — verify evidence attachments.");
        }

        if (proof.TryGetProperty("auditRowsPresentOrLowerBound", out JsonElement auditEl)
            && auditEl.ValueKind == JsonValueKind.False)
        {
            warnReasons.Add("No audit rows present for this run — audit trail evidence is incomplete.");
        }

        if (proof.TryGetProperty("llmCallCountResolved", out JsonElement llmResolvedEl)
            && llmResolvedEl.ValueKind == JsonValueKind.False)
        {
            warnReasons.Add("LLM call count could not be resolved from execution traces.");
        }

        if (proof.TryGetProperty("sponsorProofReadiness", out JsonElement readinessEl)
            && readinessEl.ValueKind == JsonValueKind.String)
        {
            string? readiness = readinessEl.GetString();

            if (string.Equals(readiness, "Incomplete", StringComparison.OrdinalIgnoreCase))
                holdReasons.Add("Sponsor proof readiness is Incomplete.");

            if (string.Equals(readiness, "DemoOnly", StringComparison.OrdinalIgnoreCase))
                holdReasons.Add("Sponsor proof readiness is DemoOnly — external circulation requires demo caveats.");
        }
    }

    private static void EvaluateRoiSources(
        JsonElement root,
        List<string> holdReasons,
        List<string> warnReasons,
        string deltasJson)
    {
        bool hasSources = root.TryGetProperty("roiMetricSources", out JsonElement sourcesEl)
                          && sourcesEl.ValueKind == JsonValueKind.Array
                          && sourcesEl.GetArrayLength() > 0;

        if (root.TryGetProperty("estimatedUsdSavings", out JsonElement savingsEl)
            && savingsEl.ValueKind == JsonValueKind.Number
            && savingsEl.TryGetDecimal(out decimal savings)
            && savings > 0m
            && !hasSources)
        {
            holdReasons.Add("Estimated USD savings present without ROI metric source catalog rows.");
        }

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement proof)
            && proof.TryGetProperty("roiEvidenceConfidence", out JsonElement confidenceEl)
            && confidenceEl.ValueKind == JsonValueKind.String)
        {
            string? confidence = confidenceEl.GetString();

            if (string.Equals(confidence, "Low", StringComparison.OrdinalIgnoreCase))
                warnReasons.Add("ROI evidence confidence is Low — label savings claims accordingly.");
        }

        string roiFreshness = PilotProofPacketRoiFreshnessEvaluator.ResolveDisposition(deltasJson, DateTime.UtcNow);

        if (string.Equals(roiFreshness, "HOLD", StringComparison.Ordinal))
            holdReasons.Add("ROI source freshness is HOLD — stale extractor or unsourced savings claim.");
        else if (string.Equals(roiFreshness, "WARN", StringComparison.Ordinal))
            warnReasons.Add("ROI source freshness is WARN — benchmark or demo assumptions apply to savings lines.");
    }

    private static void EvaluateDemoTenant(JsonElement root, List<string> holdReasons, List<string> warnReasons)
    {
        if (root.TryGetProperty("isDemoTenant", out JsonElement demoEl)
            && demoEl.ValueKind == JsonValueKind.True)
        {
            warnReasons.Add("Demo tenant — ROI and findings are illustrative, not production attestations.");
        }
    }
}
