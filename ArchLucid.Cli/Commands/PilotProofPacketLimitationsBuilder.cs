using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class PilotProofPacketLimitationsBuilder
{
    internal static string BuildMarkdown(
        bool demoWarning,
        string deltasJson,
        string? aggregateJson,
        string? structuralExecutionModeLabel)
    {
        StringBuilder sb = new();
        sb.AppendLine("# Limitations");
        sb.AppendLine();
        sb.AppendLine("This proof packet summarizes one committed architecture review. It is buyer-safe by design (no secrets).");
        sb.AppendLine();
        sb.AppendLine(PilotProofPacketStructuralExecutionModeFormatter.BuildSponsorCaveatLine(structuralExecutionModeLabel));
        sb.AppendLine();

        if (demoWarning)
        {
            sb.AppendLine("- **Demo data warning:** Contoso/demo seed — do not quote as a customer outcome.");
            sb.AppendLine();
        }

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            if (proof.TryGetProperty("agentOutputPilotStrictEvidenceSatisfied", out JsonElement strict)
                && strict.ValueKind == JsonValueKind.False)
            {
                sb.AppendLine("- **PilotStrict evidence:** not satisfied for this run — hold sponsor-safe real-mode wording.");
                sb.AppendLine();
            }
        }

        string roiFreshnessLine = PilotProofPacketRoiFreshnessEvaluator.BuildLimitationsLine(deltasJson, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(roiFreshnessLine))
        {
            sb.AppendLine($"- {roiFreshnessLine}");
            sb.AppendLine();
        }

        string? explanationLine = PilotProofPacketExplanationConfidenceEvaluator.BuildLimitationsLine(aggregateJson);

        if (!string.IsNullOrWhiteSpace(explanationLine))
        {
            sb.AppendLine($"- {explanationLine}");
            sb.AppendLine();
        }

        if (root.TryGetProperty("topFindingEvidenceChain", out JsonElement chainEl)
            && chainEl.ValueKind == JsonValueKind.Object
            && chainEl.TryGetProperty("confidenceLabel", out JsonElement confidenceEl)
            && confidenceEl.ValueKind == JsonValueKind.String)
        {
            string? confidence = confidenceEl.GetString();

            if (string.Equals(confidence, "Low", StringComparison.OrdinalIgnoreCase)
                || string.Equals(confidence, "Heuristic", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- **Explanation / evidence chain:** top finding uses low-confidence or heuristic evidence — verify before sponsor send.");
                sb.AppendLine();
            }
        }

        sb.AppendLine("## Skipped or out-of-scope gates");
        sb.AppendLine();
        sb.AppendLine("- SOC 2 CPA attestation, third-party pen test, and live Marketplace checkout are deferred procurement items.");
        sb.AppendLine("- Environment-wide first-pilot proof rollup (`collect-first-pilot-proof.ps1`) may include gates not represented in this run-only folder.");
        sb.AppendLine("- Estimated LLM/Azure costs are model-derived — not invoice truth.");
        sb.AppendLine();

        return sb.ToString();
    }
}
