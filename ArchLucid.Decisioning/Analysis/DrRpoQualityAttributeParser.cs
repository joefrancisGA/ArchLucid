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

    private static int ConvertHoursToMinutes(decimal hours) =>
        (int)Math.Round(hours * 60m, MidpointRounding.AwayFromZero);

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
