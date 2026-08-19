using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.QualityAttribute" /> nodes from structured-brief quality text (TB-2345).
/// </summary>
public static partial class RequestQualityAttributeMaterializer
{
    public static IReadOnlyList<GraphNode> MaterializeFromQualityAttribute(string? qualityAttribute, Guid snapshotId)
    {
        if (string.IsNullOrWhiteSpace(qualityAttribute))
            return [];

        decimal? rtoHours = TryParseRtoHours(qualityAttribute);
        decimal? rpoHours = TryParseRpoHours(qualityAttribute);

        if (rtoHours is null && rpoHours is null)
            return [];

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["theme"] = "availability",
            ["sourceQualityAttribute"] = qualityAttribute.Trim(),
        };

        if (rtoHours is decimal rto)
            properties["rtoHours"] = rto.ToString(CultureInfo.InvariantCulture);

        if (rpoHours is decimal rpo)
            properties["rpoHours"] = rpo.ToString(CultureInfo.InvariantCulture);

        return
        [
            new GraphNode
            {
                NodeId = $"quality-attribute-{snapshotId:N}",
                NodeType = GraphNodeTypes.QualityAttribute,
                Label = "Availability quality attribute",
                SourceType = "RequestQualityAttribute",
                SourceId = snapshotId.ToString(),
                Properties = properties,
            },
        ];
    }

    internal static decimal? TryParseRtoHours(string text)
    {
        return TryParseDurationHours(text, "rto");
    }

    internal static decimal? TryParseRpoHours(string text)
    {
        return TryParseDurationHours(text, "rpo");
    }

    private static decimal? TryParseDurationHours(string text, string keyword)
    {
        Match match = DurationRegex().Match(text);

        while (match.Success)
        {
            string capturedKeyword = match.Groups["keyword"].Value;

            if (!capturedKeyword.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                match = match.NextMatch();
                continue;
            }

            if (!decimal.TryParse(match.Groups["amount"].Value, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal amount))
            {
                match = match.NextMatch();
                continue;
            }

            string unit = match.Groups["unit"].Value.ToLowerInvariant();

            if (unit.StartsWith("m", StringComparison.Ordinal))
                return Math.Round(amount / 60m, 4, MidpointRounding.AwayFromZero);

            if (unit.StartsWith("h", StringComparison.Ordinal))
                return amount;

            if (unit.StartsWith("d", StringComparison.Ordinal))
                return amount * 24m;

            return amount;
        }

        return null;
    }

    [GeneratedRegex(
        @"(?<keyword>rto|rpo)\s*(?<amount>\d+(?:\.\d+)?)\s*(?<unit>hours?|hrs?|h|minutes?|mins?|m|days?|d)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DurationRegex();
}
