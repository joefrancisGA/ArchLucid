using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>Quote-to-proof readiness JSON for <c>pilot proof-packet</c> folders.</summary>
public static class PilotProofPacketCommercialReadinessBuilder
{
    public static string BuildJson(
        string runId,
        string deltasJson,
        bool demoWarning,
        bool pilotStrictSatisfied,
        string? aggregateExplanationJson = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(deltasJson);

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        string roiBasis = ResolveRoiBasisStatus(root);

        bool deferredScope =
            root.TryGetProperty("proofPackageCompleteness", out JsonElement proof)
            && proof.TryGetProperty("deferredBuyerRequirementsPresent", out JsonElement deferredEl)
            && deferredEl.ValueKind == JsonValueKind.True;

        string dataConsistencyDisposition = ResolveDataConsistencyDisposition(runId, deltasJson);

        string roiFreshnessDisposition = PilotProofPacketRoiFreshnessEvaluator.ResolveDisposition(deltasJson, DateTime.UtcNow);

        string explanationConfidenceDisposition =
            PilotProofPacketExplanationConfidenceEvaluator.ResolveDisposition(aggregateExplanationJson);

        string proofDisposition = ResolveProofDisposition(
            root,
            demoWarning,
            pilotStrictSatisfied,
            roiBasis,
            deferredScope,
            dataConsistencyDisposition,
            roiFreshnessDisposition,
            explanationConfidenceDisposition);

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = PilotProofPacketArtifactCatalog.QuoteToProofSchema,
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId,
            ["proofDisposition"] = proofDisposition,
            ["sponsorHandoffRecommended"] = proofDisposition is "READY" or "WARN",
            ["sponsorHandoffRequiresCaveats"] = proofDisposition == "WARN",
            ["roiBasisStatus"] = roiBasis,
            ["demoDataWarning"] = demoWarning,
            ["deferredBuyerRequirementsPresent"] = deferredScope,
            ["dataConsistencyDisposition"] = dataConsistencyDisposition,
            ["roiFreshnessDisposition"] = roiFreshnessDisposition,
            ["explanationConfidenceDisposition"] = explanationConfidenceDisposition,
            ["recommendedOffer"] = "Architecture Review Pilot (service-led or SaaS trial)",
            ["recommendedTier"] = "Team tier — see PRICING_PHILOSOPHY.md",
            ["followUpSlaDays"] = 7,
            ["nextCustomerAsk"] = proofDisposition is "READY" or "WARN"
                ? "Schedule 30-minute decision review with sponsor first-page status table."
                : "Resolve HOLD items in limitations.md before external sponsor send.",
            ["ownerAction"] = "Log quote follow-up per commercial decision packet.",
        };

        return JsonSerializer.Serialize(
            payload,
            new JsonSerializerOptions { WriteIndented = true });
    }

    internal static string ResolveRoiBasisStatus(JsonElement root)
    {
        int sourceCount = 0;

        if (root.TryGetProperty("roiMetricSources", out JsonElement sources)
            && sources.ValueKind == JsonValueKind.Array)
        {
            sourceCount = sources.GetArrayLength();
        }

        if (sourceCount > 0)
            return "classified";

        if (HasUnsourcedRoiClaim(root))
            return "hold_missing_sources";

        return "not_collected";
    }

    internal static string ResolveProofDisposition(
        JsonElement root,
        bool demoWarning,
        bool pilotStrictSatisfied,
        string roiBasisStatus,
        bool deferredScopePresent,
        string dataConsistencyDisposition,
        string roiFreshnessDisposition,
        string explanationConfidenceDisposition)
    {
        if (string.Equals(dataConsistencyDisposition, "HOLD", StringComparison.Ordinal))
            return "HOLD";

        if (string.Equals(roiFreshnessDisposition, "HOLD", StringComparison.Ordinal))
            return "HOLD";

        if (string.Equals(explanationConfidenceDisposition, "HOLD", StringComparison.Ordinal))
            return "HOLD";

        if (deferredScopePresent && demoWarning)
            return "HOLD";

        if (deferredScopePresent && !pilotStrictSatisfied)
            return "HOLD";

        if (deferredScopePresent)
            return "DEFERRED_SCOPE";

        if (demoWarning || !pilotStrictSatisfied)
            return "HOLD";

        if (string.Equals(roiBasisStatus, "hold_missing_sources", StringComparison.Ordinal))
            return "HOLD";

        if (string.Equals(explanationConfidenceDisposition, "WARN", StringComparison.Ordinal))
            return "WARN";

        return "READY";
    }

    internal static string ResolveDataConsistencyDisposition(string runId, string deltasJson)
    {
        string json = PilotProofPacketDataConsistencyArtifacts.BuildSummaryJson(runId, deltasJson);

        using JsonDocument doc = JsonDocument.Parse(json);

        return doc.RootElement.GetProperty("disposition").GetString() ?? "WARN";
    }

    internal static bool HasUnsourcedRoiClaim(JsonElement root)
    {
        if (root.TryGetProperty("estimatedUsdSavings", out JsonElement savingsEl)
            && savingsEl.ValueKind == JsonValueKind.Number
            && savingsEl.TryGetDecimal(out decimal savings)
            && savings > 0m)
        {
            return true;
        }

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            if (proof.TryGetProperty("roiEvidenceConfidence", out JsonElement confidenceEl)
                && confidenceEl.ValueKind == JsonValueKind.String)
            {
                string? confidence = confidenceEl.GetString();

                if (string.Equals(confidence, "Partial", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(confidence, "Low", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            if (proof.TryGetProperty("roiBaselineInputs", out JsonElement baselineEl)
                && baselineEl.ValueKind == JsonValueKind.Object
                && baselineEl.TryGetProperty("projectedDollarClaimsSponsorSafe", out JsonElement safeEl)
                && safeEl.ValueKind == JsonValueKind.True)
            {
                return true;
            }
        }

        return false;
    }
}
