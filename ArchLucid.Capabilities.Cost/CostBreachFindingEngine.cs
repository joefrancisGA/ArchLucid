using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Capabilities.Cost;

/// <summary>
///     Emits deterministic findings when projected monthly spend exceeds a declared <c>CostConstraint</c> cap (TB-2212).
/// </summary>
public sealed class CostBreachFindingEngine : IFindingEngine
{
    public string EngineType => "cost-breach";

    public string Category => "Cost";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<Finding> findings = [];
        IReadOnlyList<GraphNode> costNodes = graphSnapshot.GetNodesByType("CostConstraint");
        FindingSeverity? severityOverride = PolicyExpectationCostGraphReader.ResolveBreachSeverityOverride(graphSnapshot);

        foreach (GraphNode node in costNodes)
        {
            Finding? finding = TryCreateBreachFinding(node, severityOverride);

            if (finding is not null)
                findings.Add(finding);
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding? TryCreateBreachFinding(GraphNode node, FindingSeverity? severityOverride)
    {
        if (!node.Properties.TryGetValue("maxMonthlyCost", out string? maxCostRaw)
            || !CostGraphDecimalParser.TryParse(maxCostRaw, out decimal maxMonthlyCost))
        {
            return null;
        }

        decimal? projectedSpend = ResolveProjectedMonthlySpend(node);

        if (projectedSpend is not decimal spend || spend <= maxMonthlyCost)
            return null;

        node.Properties.TryGetValue("budgetName", out string? budgetName);
        string resolvedBudgetName = ResolveBudgetDisplayName(node, budgetName);
        node.Properties.TryGetValue("projectedImpactUsdLowerBound", out string? lowerBoundRaw);
        node.Properties.TryGetValue("projectedImpactUsdUpperBound", out string? upperBoundRaw);

        decimal? lowerBound = TryParseDecimal(lowerBoundRaw);
        decimal? upperBound = TryParseDecimal(upperBoundRaw);
        decimal breachAmount = spend - maxMonthlyCost;
        FindingSeverity severity = severityOverride ?? FindingSeverity.Error;
        string rationale = BuildBreachRationale(node);
        List<string> traceNotes =
        [
            $"Budget cap: {CostGraphDecimalParser.FormatUsdPerMonth(maxMonthlyCost)}",
            $"Projected spend: {CostGraphDecimalParser.FormatUsdPerMonth(spend)}",
            $"Breach amount: {CostGraphDecimalParser.FormatUsdPerMonth(breachAmount)}",
        ];
        traceNotes.AddRange(BuildSupplementalTraceNotes(node));

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.CostBreachFinding,
            Category = "Cost",
            EngineType = "cost-breach",
            Severity = severity,
            Title = $"Monthly cost breach: {resolvedBudgetName}",
            Rationale = rationale,
            RelatedNodeIds = [node.NodeId],
            ProjectedImpactUsd = spend,
            PayloadType = nameof(CostBreachFindingPayload),
            Payload = new CostBreachFindingPayload
            {
                BudgetName = resolvedBudgetName,
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
                Notes = traceNotes
            }
        };
    }

    private static string BuildBreachRationale(GraphNode node)
    {
        const string baseRationale =
            "Projected monthly spend exceeds the declared budget cap from the cost constraint node.";

        if (!node.Properties.TryGetValue("confidenceReasoning", out string? confidenceReasoning)
            || string.IsNullOrWhiteSpace(confidenceReasoning))
        {
            return UsesIllustrativeTopologyProjection(node)
                ? $"{baseRationale} {CostConstraintFindingHonesty.ProjectedSpendIllustrativeRationaleSuffix}"
                : baseRationale;
        }

        if (confidenceReasoning.Contains("illustrative", StringComparison.OrdinalIgnoreCase))
        {
            return $"{baseRationale} {CostConstraintFindingHonesty.ProjectedSpendIllustrativeRationaleSuffix}";
        }

        return baseRationale;
    }

    private static IEnumerable<string> BuildSupplementalTraceNotes(GraphNode node)
    {
        if (TopologyInstanceCountWasAssumed(node))
        {
            yield return CostConstraintFindingHonesty.TopologyInstanceCountAssumedNote;
        }

        if (UnknownPlatformIllustrativePlaceholderWasUsed(node))
        {
            yield return CostConstraintFindingHonesty.UnknownPlatformIllustrativePlaceholderNote;
        }
    }

    private static bool UsesIllustrativeTopologyProjection(GraphNode node) =>
        node.Properties.TryGetValue("projectedSpendIllustrative", out string? illustrativeRaw)
        && string.Equals(illustrativeRaw?.Trim(), "true", StringComparison.OrdinalIgnoreCase);

    private static bool TopologyInstanceCountWasAssumed(GraphNode node) =>
        node.Properties.TryGetValue("topologyInstanceCountAssumed", out string? assumedRaw)
        && string.Equals(assumedRaw?.Trim(), "true", StringComparison.OrdinalIgnoreCase);

    private static bool UnknownPlatformIllustrativePlaceholderWasUsed(GraphNode node) =>
        node.Properties.TryGetValue("unknownPlatformIllustrativePlaceholder", out string? unknownRaw)
        && string.Equals(unknownRaw?.Trim(), "true", StringComparison.OrdinalIgnoreCase);

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

    private static decimal? TryParseDecimal(string? raw) =>
        CostGraphDecimalParser.TryParse(raw, out decimal value) ? value : null;

    private static string ResolveBudgetDisplayName(GraphNode node, string? budgetName)
    {
        if (!string.IsNullOrWhiteSpace(budgetName))
            return budgetName.Trim();

        if (!string.IsNullOrWhiteSpace(node.Label))
            return node.Label.Trim();

        return CostConstraintFindingHonesty.BudgetNameNotStored;
    }
}
