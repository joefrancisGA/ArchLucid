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

        double? ratio = null;

        if (TryGetPropertyCaseInsensitive(root, "faithfulnessSupportRatio", out JsonElement ratioEl)
            && ratioEl.ValueKind == JsonValueKind.Number
            && ratioEl.TryGetDouble(out double parsedRatio)
            && double.IsFinite(parsedRatio))
        {
            ratio = parsedRatio;
        }

        bool fallback =
            (TryGetPropertyCaseInsensitive(root, "deterministicFallbackUsed", out JsonElement direct)
             && direct.ValueKind == JsonValueKind.True)
            || (TryGetPropertyCaseInsensitive(root, "usedDeterministicFallback", out JsonElement legacy)
                && legacy.ValueKind == JsonValueKind.True);

        string? warning = TryGetPropertyCaseInsensitive(root, "faithfulnessWarning", out JsonElement warningEl)
                          && warningEl.ValueKind == JsonValueKind.String
            ? warningEl.GetString()?.Trim()
            : null;

        int? citationCount = null;

        if (TryGetPropertyCaseInsensitive(root, "citations", out JsonElement citationsEl) && citationsEl.ValueKind == JsonValueKind.Array)
            citationCount = citationsEl.GetArrayLength();

        return new RunExplanationConfidenceSignals(ratio, fallback, warning, citationCount);
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
            return FormattableString.Invariant($"**Explanation confidence ({disposition}):** {signals.FaithfulnessWarning.Trim()}");

        if (signals.DeterministicFallbackUsed)
            return "**Explanation confidence (HOLD):** aggregate narrative used deterministic fallback — treat as unsupported for sponsor send.";

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

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
