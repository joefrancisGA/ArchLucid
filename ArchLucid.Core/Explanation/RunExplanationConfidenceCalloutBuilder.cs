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

        try
        {
            using JsonDocument doc = JsonDocument.Parse(aggregateJson);
            JsonElement root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            _ = RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(root);
            _ = RunExplanationRiskCalloutBuilder.TryParseRiskPosture(root);
            _ = RunExplanationCostCalloutBuilder.TryParseDecisionCount(root);
            _ = RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(root);

            return ParseConfidenceSignals(root);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static string ResolveDisposition(RunExplanationConfidenceSignals? signals)
    {
        if (signals is null)
            return "HOLD";

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
        if (signals is null)
        {
            return "Explanation confidence: aggregate narrative was not collected — verify review detail before sponsor send.";
        }

        string? line = BuildLimitationsLine(signals);

        if (line is null)
            return null;

        return line.Replace("**", string.Empty, StringComparison.Ordinal).Trim();
    }

    private static RunExplanationConfidenceSignals ParseConfidenceSignals(JsonElement root)
    {
        double? ratio = null;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "faithfulnessSupportRatio", out JsonElement ratioEl))
            ratio = RunExplanationAggregateJsonReader.NormalizeUnitRatio(
                RunExplanationAggregateJsonReader.TryReadAggregateRatioToken(ratioEl));

        bool fallback = false;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(
                root,
                "deterministicFallbackUsed",
                out JsonElement direct)
            && RunExplanationAggregateJsonReader.TryReadAggregateBooleanToken(direct, out bool directFallback))
        {
            fallback = directFallback;
        }
        else if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(
                     root,
                     "usedDeterministicFallback",
                     out JsonElement legacy)
                 && RunExplanationAggregateJsonReader.TryReadAggregateBooleanToken(legacy, out bool legacyFallback))
        {
            fallback = legacyFallback;
        }

        string? warning = RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "faithfulnessWarning", out JsonElement warningEl)
                            && RunExplanationAggregateJsonReader.TryReadAggregateStringCalloutToken(warningEl, out string? warningText)
            ? warningText?.Trim()
            : null;

        int? citationCount = null;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "citations", out JsonElement citationsEl))
        {
            if (citationsEl.ValueKind == JsonValueKind.Null)
            {
                citationCount = 0;
            }
            else if (citationsEl.ValueKind == JsonValueKind.Array)
            {
                citationCount = TryParseCitationCountArray(citationsEl);
            }
            else if (citationsEl.ValueKind == JsonValueKind.Object)
            {
                citationCount = CountCitationObject(citationsEl);
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

                if (string.IsNullOrWhiteSpace(raw))
                {
                    citationCount = 0;
                }
                else if (RunExplanationAggregateJsonReader.TryParseBooleanString(raw, out bool booleanCount))
                {
                    citationCount = booleanCount ? 1 : 0;
                }
                else if (RunExplanationAggregateJsonReader.TryParseWholeNumberString(raw, out int stringEncodedCount))
                {
                    citationCount = stringEncodedCount;
                }
                else
                {
                    citationCount = 0;
                }
            }
        }
        else
        {
            citationCount = 0;
        }

        return new RunExplanationConfidenceSignals(ratio, fallback, warning, citationCount);
    }

    private static int TryParseCitationCountArray(JsonElement citationsArray)
    {
        int nonNullEntries = 0;

        foreach (JsonElement item in citationsArray.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Null)
                nonNullEntries++;
        }

        if (nonNullEntries == 1
            && RunExplanationAggregateJsonReader.TryReadAggregateWholeNumberCountToken(citationsArray, out int soleArrayCount))
        {
            return soleArrayCount;
        }

        return CountFlattenedCitations(citationsArray);
    }

    private static int CountFlattenedCitations(JsonElement citationsArray)
    {
        int count = 0;

        foreach (JsonElement item in citationsArray.EnumerateArray())
            count += CountFlattenedCitationEntry(item);

        return count;
    }

    private static int CountFlattenedCitationEntry(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.Array)
        {
            int count = 0;

            foreach (JsonElement inner in item.EnumerateArray())
                count += CountFlattenedCitationEntry(inner);

            return count;
        }

        if (item.ValueKind == JsonValueKind.Object)
            return CountCitationObject(item);

        if (item.ValueKind == JsonValueKind.String)
            return string.IsNullOrWhiteSpace(item.GetString()) ? 0 : 1;

        if (item.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return item.ValueKind == JsonValueKind.True ? 1 : 0;

        if (item.ValueKind == JsonValueKind.Number
            && RunExplanationAggregateJsonReader.TryReadWholeNumber(item, out _))
        {
            return 1;
        }

        return 0;
    }

    private static int CountCitationObject(JsonElement item)
    {
        if (item.ValueKind != JsonValueKind.Object)
            return 0;

        return string.IsNullOrWhiteSpace(RunExplanationAggregateJsonReader.TryReadEvidenceRefObjectStringProperty(item))
            ? 0
            : 1;
    }
}
