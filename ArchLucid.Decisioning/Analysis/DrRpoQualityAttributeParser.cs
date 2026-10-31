using System.Globalization;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Reads typed availability recovery objectives from materialized quality-attribute nodes (TB-2345).
/// </summary>
public static class DrRpoQualityAttributeParser
{
    public static bool TryParseRecoveryObjectives(
        GraphNode qualityAttributeNode,
        out int? rpoMinutes,
        out int? rtoMinutes)
    {
        ArgumentNullException.ThrowIfNull(qualityAttributeNode);

        rpoMinutes = null;
        rtoMinutes = null;

        if (!string.Equals(qualityAttributeNode.NodeType, GraphNodeTypes.QualityAttribute, StringComparison.OrdinalIgnoreCase))
            return false;

        if (TryGetHoursProperty(qualityAttributeNode.Properties, "rtoHours", out decimal rtoHours))
            rtoMinutes = ConvertHoursToMinutes(rtoHours);

        if (TryGetHoursProperty(qualityAttributeNode.Properties, "rpoHours", out decimal rpoHours))
            rpoMinutes = ConvertHoursToMinutes(rpoHours);

        return rpoMinutes is not null || rtoMinutes is not null;
    }

    private static int ConvertHoursToMinutes(decimal hours)
    {
        decimal minutes = hours * 60m;
        int rounded = (int)Math.Round(minutes, MidpointRounding.AwayFromZero);

        // "RPO 0.5 minutes" is stored as 0.0083 hours. Rounding that product lands on 0,
        // which the finding then states as an RPO of 0 minutes. A positive fraction stays
        // at one minute, matching the requirement parser's whole-minute bound.
        if (rounded == 0 && minutes > 0)
            return 1;

        return rounded;
    }

    private static bool TryGetHoursProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out decimal hours)
    {
        hours = default;

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(entry.Value))
            {
                continue;
            }

            if (decimal.TryParse(entry.Value.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out hours))
                return true;
        }

        return false;
    }
}
