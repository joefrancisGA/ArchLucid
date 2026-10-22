using System.Globalization;
using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Conservative lexical parse of requirement text for RPO/RTO minutes (DX-08).</summary>
public static partial class DrRpoRequirementParser
{
    // Request templates use "RPO under 1 hour" and "RTO < 5 minutes, RPO < 30 seconds".
    // Draft intake also copies a quality attribute such as "RPO 1 day" onto a requirement;
    // that materializer already treats a day as 24 hours, so this grammar must agree.
    [GeneratedRegex(
        @"\b(?<kind>rpo|rto)\b\s*(?:<=|[:=]|[<≤]|-)?\s*(?:\b(?:under|within|below)\b|\bless\s+than\b|\bat\s+most\b|\bno\s+more\s+than\b)?\s*(?<value>\d+(?:\.\d+)?)\s*(?<unit>seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|h|m|d)?\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ObjectiveRegex();

    [GeneratedRegex(
        @"\bpt(?<minutes>\d+)m\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex IsoDurationMinutesRegex();

    public static bool TryParseRecoveryObjectives(
        string requirementLabel,
        IReadOnlyDictionary<string, string> properties,
        out int? rpoMinutes,
        out int? rtoMinutes)
    {
        ArgumentNullException.ThrowIfNull(properties);

        string combined = BuildCombinedText(requirementLabel, properties);

        rpoMinutes = TryParseRpoMinutes(combined);
        rtoMinutes = TryParseRtoMinutes(combined);

        if (rpoMinutes is null && rtoMinutes is null)
        {
            return false;
        }

        return true;
    }

    private static string BuildCombinedText(string requirementLabel, IReadOnlyDictionary<string, string> properties)
    {
        List<string> segments = [];

        if (!string.IsNullOrWhiteSpace(requirementLabel))
        {
            segments.Add(requirementLabel.Trim());
        }

        if (TryGetProperty(properties, "text", out string? text))
        {
            segments.Add(text);
        }

        if (TryGetProperty(properties, "description", out string? description))
        {
            segments.Add(description);
        }

        if (TryGetProperty(properties, "rpo", out string? rpo))
        {
            segments.Add($"RPO {rpo}");
        }

        if (TryGetProperty(properties, "rto", out string? rto))
        {
            segments.Add($"RTO {rto}");
        }

        return string.Join(' ', segments);
    }

    private static int? TryParseRpoMinutes(string combined)
    {
        int? parsed = TryParseKindMinutes(combined, "rpo");

        if (parsed is not null)
            return parsed;

        Match isoMatch = IsoDurationMinutesRegex().Match(combined);

        if (isoMatch.Success
            && combined.Contains("rpo", StringComparison.OrdinalIgnoreCase))
        {
            return int.Parse(isoMatch.Groups["minutes"].Value, CultureInfo.InvariantCulture);
        }

        return null;
    }

    private static int? TryParseRtoMinutes(string combined) =>
        TryParseKindMinutes(combined, "rto");

    private static int? TryParseKindMinutes(string combined, string kind)
    {
        Match match = ObjectiveRegex().Match(combined);

        while (match.Success)
        {
            if (match.Groups["kind"].Value.Equals(kind, StringComparison.OrdinalIgnoreCase))
            {
                int? minutes = ParseDurationMinutes(match.Groups["value"].Value, match.Groups["unit"].Value);

                if (minutes is not null)
                    return minutes;
            }

            match = match.NextMatch();
        }

        return null;
    }

    private static int? ParseDurationMinutes(string valueText, string unitText)
    {
        if (!decimal.TryParse(valueText, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal value))
            return null;

        if (value < 0)
            return null;

        decimal minutes = ConvertToMinutes(value, unitText);

        if (minutes > int.MaxValue)
            return null;

        if (minutes == 0)
            return 0;

        // Findings store whole minutes. A positive fraction (30 seconds) rounds up so the
        // bound is not dropped to zero and is not reported as if the number were already minutes.
        return (int)Math.Ceiling(minutes);
    }

    private static decimal ConvertToMinutes(decimal value, string unitText)
    {
        string unit = unitText.ToLowerInvariant();

        if (unit.StartsWith('s'))
            return value / 60m;

        if (unit.StartsWith('h'))
            return value * 60m;

        if (unit.StartsWith('d'))
            return value * 1440m;

        return value;
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = string.Empty;

        return false;
    }
}
