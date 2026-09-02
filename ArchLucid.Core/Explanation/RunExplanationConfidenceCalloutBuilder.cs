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

        if (TryGetPropertyCaseInsensitive(root, "faithfulnessSupportRatio", out JsonElement ratioEl))
        {
            ratio = TryReadFiniteDouble(ratioEl);
        }

        bool fallback =
            (TryGetPropertyCaseInsensitive(root, "deterministicFallbackUsed", out JsonElement direct)
             && TryReadBoolean(direct))
            || (TryGetPropertyCaseInsensitive(root, "usedDeterministicFallback", out JsonElement legacy)
                && TryReadBoolean(legacy));

        string? warning = TryGetPropertyCaseInsensitive(root, "faithfulnessWarning", out JsonElement warningEl)
                          && TryReadNonEmptyTextToken(warningEl, out string? warningText)
            ? warningText?.Trim()
            : null;

        int? citationCount = null;

        if (TryGetPropertyCaseInsensitive(root, "citations", out JsonElement citationsEl))
        {
            if (citationsEl.ValueKind == JsonValueKind.Array)
            {
                citationCount = citationsEl.GetArrayLength();
            }
            else if (citationsEl.ValueKind == JsonValueKind.Number
                     && TryReadWholeNumber(citationsEl, out int wholeNumberCount))
            {
                citationCount = wholeNumberCount;
            }
            else if (citationsEl.ValueKind == JsonValueKind.String
                     && TryParseWholeNumberString(citationsEl.GetString(), out int stringEncodedCount))
            {
                citationCount = stringEncodedCount;
            }
        }

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

    private static double? TryReadFiniteDouble(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric))
        {
            return numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (double.TryParse(raw.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            && double.IsFinite(parsed))
        {
            return parsed;
        }

        return null;
    }

    private static bool TryReadBoolean(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.True)
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.False)
        {
            return false;
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt32(out int numeric))
            {
                return numeric != 0;
            }

            return false;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        string? raw = element.GetString()?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("no", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return false;
    }

    private static bool TryReadWholeNumber(JsonElement element, out int value)
    {
        if (element.TryGetInt32(out value))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadNonEmptyTextToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            value = element.GetString();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        value = null;

        return false;
    }
}
