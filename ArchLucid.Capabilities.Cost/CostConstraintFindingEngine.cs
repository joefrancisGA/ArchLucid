using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models; // GraphSnapshotExtensions

namespace ArchLucid.Capabilities.Cost;

/// <summary>
///     Emits findings for <c>CostConstraint</c> graph nodes.
/// </summary>
public sealed class CostConstraintFindingEngine : IFindingEngine
{
    public string EngineType => "cost-constraint";
    public string Category => "Cost";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        List<Finding> findings = [];

        IReadOnlyList<GraphNode> costNodes = graphSnapshot.GetNodesByType("CostConstraint");

        foreach (GraphNode node in costNodes)
        {
            node.Properties.TryGetValue("budgetName", out string? budgetName);
            node.Properties.TryGetValue("maxMonthlyCost", out string? maxCostStr);
            node.Properties.TryGetValue("costRisk", out string? costRisk);

            node.Properties.TryGetValue("projectedImpactUsdLowerBound", out string? lowerBoundStr);
            node.Properties.TryGetValue("projectedImpactUsdUpperBound", out string? upperBoundStr);
            node.Properties.TryGetValue("confidenceReasoning", out string? confidenceReasoning);

            decimal? maxMonthly = null;
            if (!string.IsNullOrWhiteSpace(maxCostStr) && decimal.TryParse(maxCostStr, out decimal mc))
                maxMonthly = mc;

            decimal? lowerBound = null;
            if (!string.IsNullOrWhiteSpace(lowerBoundStr) && decimal.TryParse(lowerBoundStr, out decimal lb))
                lowerBound = lb;

            decimal? upperBound = null;
            if (!string.IsNullOrWhiteSpace(upperBoundStr) && decimal.TryParse(upperBoundStr, out decimal ub))
                upperBound = ub;

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "CostConstraintFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = string.Equals(costRisk, "high", StringComparison.OrdinalIgnoreCase)
                    ? FindingSeverity.Warning
                    : FindingSeverity.Info,
                Title = $"Cost constraint: {node.Label}",
                Rationale = "A cost constraint node was found and should constrain architecture choices.",
                RelatedNodeIds = [node.NodeId],
                ProjectedImpactUsd = maxMonthly, // Assign maxMonthly to ProjectedImpactUsd to ensure it has a point estimate for ROI
                PayloadType = nameof(CostConstraintFindingPayload),
                Payload =
                    new CostConstraintFindingPayload
                    {
                        BudgetName = budgetName ?? node.Label,
                        MaxMonthlyCost = maxMonthly,
                        CostRisk = costRisk ?? "unknown",
                        ProjectedImpactUsdLowerBound = lowerBound,
                        ProjectedImpactUsdUpperBound = upperBound,
                        ConfidenceReasoning = confidenceReasoning
                    },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [node.NodeId],
                    RulesApplied = ["cost-constraint-surface"],
                    DecisionsTaken = ["Emitted cost constraint finding from graph node."],
                    AlternativePathsConsidered = string.Equals(costRisk, "high", StringComparison.OrdinalIgnoreCase)
                        ?
                        [
                            "Use reserved capacity or commitment discounts to lower effective monthly spend.",
                            "Shift non-critical workloads to spot or burstable SKUs to stay under the cap."
                        ]
                        :
                        [
                            "Keep current sizing; monitor actual spend against the declared budget.",
                            "Right-size resources after a measurement window without changing the architecture pattern."
                        ],
                    Notes =
                    [
                        maxMonthly.HasValue
                            ? $"Budget cap: {maxMonthly.Value:C0}/mo"
                            : "No explicit budget cap."
                    ]
                }
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
