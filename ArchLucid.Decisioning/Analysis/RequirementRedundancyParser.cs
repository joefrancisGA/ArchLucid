using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Conservative lexical parse of requirement text for redundancy tiers (DX-25).</summary>
public static partial class RequirementRedundancyParser
{
    [GeneratedRegex(
        @"\bmulti[\s-]?region\b|\bcross[\s-]?region\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex MultiRegionRegex();

    [GeneratedRegex(
        @"\bgeo[\s-]?redundant\b|\bgrs\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex GeoRedundancyRegex();

    [GeneratedRegex(
        @"\bzone[\s-]?redundant\b|\bavailability\s+zones?\b|\bzrs\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ZoneRedundancyRegex();

    public static bool TryParse(
        string requirementLabel,
        IReadOnlyDictionary<string, string> properties,
        out RequirementRedundancyLevel requiredRedundancy)
    {
        ArgumentNullException.ThrowIfNull(properties);

        string combined = BuildCombinedText(requirementLabel, properties);

        if (string.IsNullOrWhiteSpace(combined))
        {
            requiredRedundancy = default;

            return false;
        }

        if (MultiRegionRegex().IsMatch(combined))
        {
            requiredRedundancy = RequirementRedundancyLevel.MultiRegion;

            return true;
        }

        if (GeoRedundancyRegex().IsMatch(combined))
        {
            requiredRedundancy = RequirementRedundancyLevel.Geo;

            return true;
        }

        if (ZoneRedundancyRegex().IsMatch(combined))
        {
            requiredRedundancy = RequirementRedundancyLevel.Zone;

            return true;
        }

        requiredRedundancy = default;

        return false;
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

        return string.Join(' ', segments);
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
