using System.Globalization;
using System.Text.RegularExpressions;

using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.CostConstraint" /> nodes from request constraint chips so cost
///     evaluation runs even when the topology graph is otherwise empty (TB-2211).
/// </summary>
public static partial class RequestCostConstraintMaterializer
{
    public static IReadOnlyList<GraphNode> MaterializeFromConstraintsMetadata(
        string? constraintsPipeSeparated,
        Guid snapshotId)
    {
        if (string.IsNullOrWhiteSpace(constraintsPipeSeparated))
            return [];

        List<GraphNode> nodes = [];
        int index = 0;

        foreach (string rawConstraint in constraintsPipeSeparated.Split(
                     '|',
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!LooksLikeCostConstraint(rawConstraint))
                continue;

            index++;
            decimal? maxMonthlyCost = TryParseMonthlyBudgetUsd(rawConstraint);
            decimal? projectedMonthlySpend = TryParseProjectedMonthlySpendUsd(rawConstraint);
            string budgetName = BuildBudgetName(rawConstraint, maxMonthlyCost);

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["budgetName"] = budgetName,
                ["sourceConstraint"] = rawConstraint,
                ["costRisk"] = maxMonthlyCost.HasValue ? "medium" : "unknown"
            };

            if (maxMonthlyCost.HasValue)
                properties["maxMonthlyCost"] = maxMonthlyCost.Value.ToString(CultureInfo.InvariantCulture);

            ApplyProjectedSpendProperties(properties, projectedMonthlySpend);

            nodes.Add(new GraphNode
            {
                NodeId = $"cost-constraint-{snapshotId:N}-{index}",
                NodeType = GraphNodeTypes.CostConstraint,
                Label = budgetName,
                SourceType = "RequestConstraint",
                SourceId = snapshotId.ToString(),
                Properties = properties
            });
        }

        return nodes;
    }

    internal static bool LooksLikeCostConstraint(string constraintText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(constraintText);

        if (constraintText.Contains('$', StringComparison.Ordinal))
            return true;

        if (constraintText.Contains("monthly cap", StringComparison.OrdinalIgnoreCase)
            || constraintText.Contains("price ceiling", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return CostConstraintWordRegex().IsMatch(constraintText);
    }

    internal static decimal? TryParseMonthlyBudgetUsd(string constraintText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(constraintText);

        Match match = BudgetAmountRegex().Match(constraintText);

        if (!match.Success)
            return null;

        string numericPart = match.Groups["amount"].Value.Replace(",", string.Empty, StringComparison.Ordinal);

        if (!decimal.TryParse(numericPart, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal amount))
            return null;

        if (match.Groups["suffix"].Success
            && match.Groups["suffix"].Value.Equals("k", StringComparison.OrdinalIgnoreCase))
        {
            amount *= 1000m;
        }

        return amount;
    }

    internal static decimal? TryParseProjectedMonthlySpendUsd(string constraintText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(constraintText);

        int projectedIndex = constraintText.IndexOf("projected", StringComparison.OrdinalIgnoreCase);

        if (projectedIndex < 0)
            projectedIndex = constraintText.IndexOf("expected spend", StringComparison.OrdinalIgnoreCase);

        if (projectedIndex < 0)
            return null;

        string tail = constraintText[projectedIndex..];
        Match match = BudgetAmountRegex().Match(tail);

        if (!match.Success)
            return null;

        return TryParseBudgetAmount(match);
    }

    private static void ApplyProjectedSpendProperties(Dictionary<string, string> properties, decimal? projectedMonthlySpend)
    {
        if (projectedMonthlySpend is not decimal projected)
            return;

        string projectedText = projected.ToString(CultureInfo.InvariantCulture);
        decimal lowerBound = Math.Round(projected * 0.9m, 2, MidpointRounding.AwayFromZero);
        decimal upperBound = Math.Round(projected * 1.1m, 2, MidpointRounding.AwayFromZero);

        properties["projectedMonthlySpendUsd"] = projectedText;
        properties["projectedImpactUsdLowerBound"] = lowerBound.ToString(CultureInfo.InvariantCulture);
        properties["projectedImpactUsdUpperBound"] = upperBound.ToString(CultureInfo.InvariantCulture);
        properties["confidenceReasoning"] = "Projected monthly spend parsed from request constraint text.";
    }

    private static decimal? TryParseBudgetAmount(Match match)
    {
        string numericPart = match.Groups["amount"].Value.Replace(",", string.Empty, StringComparison.Ordinal);

        if (!decimal.TryParse(numericPart, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal amount))
            return null;

        if (match.Groups["suffix"].Success
            && match.Groups["suffix"].Value.Equals("k", StringComparison.OrdinalIgnoreCase))
        {
            amount *= 1000m;
        }

        return amount;
    }

    private static string BuildBudgetName(string rawConstraint, decimal? maxMonthlyCost)
    {
        if (maxMonthlyCost.HasValue)
            return $"Request budget ({maxMonthlyCost.Value:C0}/mo)";

        string trimmed = rawConstraint.Trim();

        return trimmed.Length <= 64 ? trimmed : $"{trimmed[..61]}...";
    }

    [GeneratedRegex(
        @"(?:\$\s*|usd\s*)(?<amount>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?<suffix>k)?|(?<amount>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?<suffix>k)?\s*usd",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex BudgetAmountRegex();

    [GeneratedRegex(
        @"\b(budget|cost|spend|finops|usd)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CostConstraintWordRegex();
}
