using System.Globalization;
using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Conservative lexical parse of requirement text for RPO/RTO minutes (DX-08).</summary>
public static partial class DrRpoRequirementParser
{
    [GeneratedRegex(
        @"\brpo\b\s*[:=\-]?\s*(?<value>\d+)\s*(?<unit>min(?:ute)?s?|m|h(?:our)?s?)?",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex RpoMinutesRegex();

    [GeneratedRegex(
        @"\brto\b\s*[:=\-]?\s*(?<value>\d+)\s*(?<unit>min(?:ute)?s?|m|h(?:our)?s?)?",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex RtoMinutesRegex();

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
        Match match = RpoMinutesRegex().Match(combined);

        if (match.Success)
        {
            return ParseDurationMinutes(match.Groups["value"].Value, match.Groups["unit"].Value);
        }

        Match isoMatch = IsoDurationMinutesRegex().Match(combined);

        if (isoMatch.Success
            && combined.Contains("rpo", StringComparison.OrdinalIgnoreCase))
        {
            return int.Parse(isoMatch.Groups["minutes"].Value, CultureInfo.InvariantCulture);
        }

        return null;
    }

    private static int? TryParseRtoMinutes(string combined)
    {
        Match match = RtoMinutesRegex().Match(combined);

        if (!match.Success)
        {
            return null;
        }

        return ParseDurationMinutes(match.Groups["value"].Value, match.Groups["unit"].Value);
    }

    private static int? ParseDurationMinutes(string valueText, string unitText)
    {
        if (!int.TryParse(valueText, NumberStyles.Integer, CultureInfo.InvariantCulture, out int value))
        {
            return null;
        }

        string unit = unitText.ToLowerInvariant();

        if (unit.StartsWith("h", StringComparison.Ordinal))
        {
            return value * 60;
        }

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
