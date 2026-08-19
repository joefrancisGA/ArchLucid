using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Capabilities.Cost;

/// <summary>
///     Emits deterministic findings when projected monthly spend exceeds a declared <c>CostConstraint</c> cap (TB-2212).
/// </summary>
public sealed class CostBreachFindingEngine : IFindingEngine
{
    public string EngineType => "cost-breach";

    public string Category => "Cost";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<Finding> findings = [];
        IReadOnlyList<GraphNode> costNodes = graphSnapshot.GetNodesByType("CostConstraint");

        foreach (GraphNode node in costNodes)
        {
            Finding? finding = TryCreateBreachFinding(node);

            if (finding is not null)
                findings.Add(finding);
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding? TryCreateBreachFinding(GraphNode node)
    {
        if (!node.Properties.TryGetValue("maxMonthlyCost", out string? maxCostRaw)
            || !decimal.TryParse(maxCostRaw, out decimal maxMonthlyCost))
        {
            return null;
        }

        decimal? projectedSpend = ResolveProjectedMonthlySpend(node);

        if (projectedSpend is not decimal spend || spend <= maxMonthlyCost)
            return null;

        node.Properties.TryGetValue("budgetName", out string? budgetName);
        node.Properties.TryGetValue("projectedImpactUsdLowerBound", out string? lowerBoundRaw);
        node.Properties.TryGetValue("projectedImpactUsdUpperBound", out string? upperBoundRaw);

        decimal? lowerBound = TryParseDecimal(lowerBoundRaw);
        decimal? upperBound = TryParseDecimal(upperBoundRaw);
        decimal breachAmount = spend - maxMonthlyCost;

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.CostBreachFinding,
            Category = "Cost",
            EngineType = "cost-breach",
            Severity = FindingSeverity.Error,
            Title = $"Monthly cost breach: {node.Label}",
            Rationale =
                "Projected monthly spend exceeds the declared budget cap from the cost constraint node.",
            RelatedNodeIds = [node.NodeId],
            ProjectedImpactUsd = spend,
            PayloadType = nameof(CostBreachFindingPayload),
            Payload = new CostBreachFindingPayload
            {
                BudgetName = budgetName ?? node.Label,
                MaxMonthlyCost = maxMonthlyCost,
                ProjectedMonthlySpendUsd = spend,
                BreachAmountUsd = breachAmount,
                ProjectedImpactUsdLowerBound = lowerBound,
                ProjectedImpactUsdUpperBound = upperBound
            },
            RecommendedActions =
            [
                "Right-size or remove resources until projected monthly spend is at or below the declared cap.",
                "Raise the declared budget only after sponsor approval and update the request constraints."
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [node.NodeId],
                RulesApplied = ["cost-breach-cap-comparison"],
                DecisionsTaken =
                [
                    "Compared projected monthly spend to maxMonthlyCost on the cost constraint node."
                ],
                AlternativePathsConsidered =
                [
                    "Use reserved capacity or commitment discounts to lower effective monthly spend.",
                    "Defer non-critical workloads until the next budget review window."
                ],
                Notes =
                [
                    $"Budget cap: {maxMonthlyCost:C0}/mo",
                    $"Projected spend: {spend:C0}/mo",
                    $"Breach amount: {breachAmount:C0}/mo"
                ]
            }
        };
    }

    private static decimal? ResolveProjectedMonthlySpend(GraphNode node)
    {
        if (node.Properties.TryGetValue("projectedMonthlySpendUsd", out string? projectedRaw)
            && TryParseDecimal(projectedRaw) is decimal projectedSpend)
        {
            return projectedSpend;
        }

        if (node.Properties.TryGetValue("projectedImpactUsdUpperBound", out string? upperBoundRaw)
            && TryParseDecimal(upperBoundRaw) is decimal upperBound)
        {
            return upperBound;
        }

        if (node.Properties.TryGetValue("projectedImpactUsdLowerBound", out string? lowerBoundRaw)
            && TryParseDecimal(lowerBoundRaw) is decimal lowerBound)
        {
            return lowerBound;
        }

        return null;
    }

    private static decimal? TryParseDecimal(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return decimal.TryParse(raw, out decimal value) ? value : null;
    }
}
