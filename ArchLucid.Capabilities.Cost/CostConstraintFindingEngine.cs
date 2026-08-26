using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

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
        ArgumentNullException.ThrowIfNull(graphSnapshot);

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
                ProjectedImpactUsd = maxMonthly,
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

        if (PolicyExpectationCostGraphReader.RequiresBudgetCap(graphSnapshot)
            && PolicyExpectationCostGraphReader.GraphHasWorkloadTopology(graphSnapshot)
            && !PolicyExpectationCostGraphReader.GraphHasParseableBudgetCap(graphSnapshot))
        {
            findings.Add(CreatePolicyRequiredCapFinding(graphSnapshot));
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding CreatePolicyRequiredCapFinding(GraphSnapshot graphSnapshot)
    {
        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        List<string> relatedNodeIds = graphSnapshot.Nodes
            .Where(n => string.Equals(n.NodeType, "TopologyResource", StringComparison.OrdinalIgnoreCase))
            .Select(n => n.NodeId)
            .Take(5)
            .ToList();

        if (contextNode is not null && relatedNodeIds.Count == 0)
            relatedNodeIds.Add(contextNode.NodeId);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "CostConstraintFinding",
            Category = "Cost",
            EngineType = "cost-constraint",
            Severity = FindingSeverity.Warning,
            Title = "Policy requires a monthly budget cap",
            Rationale =
                "Tenant policy packs require a declared monthly budget cap, but no CostConstraint node exposes maxMonthlyCost.",
            RelatedNodeIds = relatedNodeIds,
            PayloadType = nameof(CostConstraintFindingPayload),
            Payload = new CostConstraintFindingPayload
            {
                BudgetName = "policy-required-cap",
                MaxMonthlyCost = null,
                CostRisk = "high",
            },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["cost-policy-require-budget-cap"],
                DecisionsTaken =
                [
                    "Policy advisoryDefaults cost.requireBudgetCap is true and topology is present without a parseable cap."
                ],
                AlternativePathsConsidered =
                [
                    "Add a CostConstraint node with maxMonthlyCost before finalizing the architecture review.",
                    "Remove cost.requireBudgetCap from tenant policy overlays if a cap is intentionally absent."
                ],
                Notes = ["Stamped policyCostRequireBudgetCap=true on context snapshot."]
            }
        };
    }
}
