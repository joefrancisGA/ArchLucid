using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Maps explanation faithfulness signals to PASS/WARN/HOLD for exports and proof packets (#20).</summary>
public static class RunExplanationConfidenceCalloutBuilder
{
    public static RunExplanationConfidenceSignals FromSummary(RunExplanationSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        bool fallback = summary.DeterministicFallbackUsed;

        return new RunExplanationConfidenceSignals(
            summary.FaithfulnessSupportRatio,
            fallback,
            summary.FaithfulnessWarning,
            summary.Citations?.Count);
    }

    public static RunExplanationConfidenceSignals? FromAggregateJson(string? aggregateJson)
    {
        if (string.IsNullOrWhiteSpace(aggregateJson))
            return null;

        using JsonDocument doc = JsonDocument.Parse(aggregateJson);
        JsonElement root = doc.RootElement;

        _ = RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(root);
        _ = RunExplanationRiskCalloutBuilder.TryParseRiskPosture(root);
        _ = RunExplanationCostCalloutBuilder.TryParseDecisionCount(root);
        _ = RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(root);

        return ParseConfidenceSignals(root);
    }

    public static string ResolveDisposition(RunExplanationConfidenceSignals? signals)
    {
        if (signals is null)
            return "PASS";

        if (signals.DeterministicFallbackUsed)
            return "HOLD";

        if (signals.FaithfulnessSupportRatio is < 0.5)
            return "HOLD";

        if (signals.FaithfulnessSupportRatio is < 0.8)
            return "WARN";

        if (!string.IsNullOrWhiteSpace(signals.FaithfulnessWarning))
            return "WARN";

        if (signals.CitationCount == 0)
            return "WARN";

        return "PASS";
    }

    public static string? BuildLimitationsLine(RunExplanationConfidenceSignals? signals)
    {
        string disposition = ResolveDisposition(signals);

        if (disposition == "PASS")
            return null;

        if (signals is null)
            return "**Explanation confidence:** aggregate narrative was not collected — verify review detail before sponsor send.";

        if (!string.IsNullOrWhiteSpace(signals.FaithfulnessWarning))
        {
            return FormattableString.Invariant(
                $"**Explanation confidence ({disposition}):** {signals.FaithfulnessWarning.Trim()}");
        }

        if (signals.DeterministicFallbackUsed)
        {
            return "**Explanation confidence (HOLD):** aggregate narrative used deterministic fallback — treat as unsupported for sponsor send.";
        }

        if (signals.FaithfulnessSupportRatio is { } ratio)
        {
            return FormattableString.Invariant(
                $"**Explanation confidence ({disposition}):** faithfulness support ratio is {Math.Round(ratio * 100, MidpointRounding.AwayFromZero)}% — review citations before sponsor send.");
        }

        return FormattableString.Invariant(
            $"**Explanation confidence ({disposition}):** review aggregate explanation on review detail before external send.");
    }

    public static string? BuildExportCallout(RunExplanationConfidenceSignals? signals)
    {
        string? line = BuildLimitationsLine(signals);

        if (line is null)
            return null;

        return line.Replace("**", string.Empty, StringComparison.Ordinal).Trim();
    }

    private static RunExplanationConfidenceSignals ParseConfidenceSignals(JsonElement root)
    {
        double? ratio = null;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "faithfulnessSupportRatio", out JsonElement ratioEl))
            ratio = RunExplanationAggregateJsonReader.TryReadFiniteDouble(ratioEl);

        bool fallback =
            (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "deterministicFallbackUsed", out JsonElement direct)
             && RunExplanationAggregateJsonReader.TryReadBoolean(direct))
            || (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "usedDeterministicFallback", out JsonElement legacy)
                && RunExplanationAggregateJsonReader.TryReadBoolean(legacy));

        string? warning = RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "faithfulnessWarning", out JsonElement warningEl)
                            && RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(warningEl, out string? warningText)
            ? warningText?.Trim()
            : null;

        int? citationCount = null;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "citations", out JsonElement citationsEl))
        {
            if (citationsEl.ValueKind == JsonValueKind.Array)
            {
                citationCount = citationsEl.GetArrayLength();
            }
            else if (citationsEl.ValueKind == JsonValueKind.Number
                     && RunExplanationAggregateJsonReader.TryReadWholeNumber(citationsEl, out int wholeNumberCount))
            {
                citationCount = wholeNumberCount;
            }
            else if (citationsEl.ValueKind is JsonValueKind.True or JsonValueKind.False)
            {
                citationCount = citationsEl.ValueKind == JsonValueKind.True ? 1 : 0;
            }
            else if (citationsEl.ValueKind == JsonValueKind.String)
            {
                string? raw = citationsEl.GetString();

                if (RunExplanationAggregateJsonReader.TryParseBooleanString(raw, out bool booleanCount))
                {
                    citationCount = booleanCount ? 1 : 0;
                }
                else if (RunExplanationAggregateJsonReader.TryParseWholeNumberString(raw, out int stringEncodedCount))
                {
                    citationCount = stringEncodedCount;
                }
            }
        }

        return new RunExplanationConfidenceSignals(ratio, fallback, warning, citationCount);
    }
}
