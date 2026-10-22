using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Decisioning.Findings;

public static partial class DecisionGradeFindingProvenanceValidator
{
    private static bool HasInventoryDrivenEngineProvenance(Finding finding)
    {
        if (!IsInventoryDrivenEngine(finding.EngineType))
            return false;

        bool hasRules = finding.Trace?.RulesApplied is { Count: > 0 } rules
                        && rules.Any(static r => !string.IsNullOrWhiteSpace(r));

        if (!hasRules)
            return false;

        if (finding.RelatedNodeIds is { Count: > 0 } nodes
            && nodes.Any(static n => !string.IsNullOrWhiteSpace(n)))
        {
            return true;
        }

        if (finding.Payload is InventoryReconciliationFindingPayload reconciliation)
        {
            return reconciliation.GraphOnlyResourceIds.Any(static id => !string.IsNullOrWhiteSpace(id))
                   || reconciliation.InventoryOnlyResourceIds.Any(static id => !string.IsNullOrWhiteSpace(id));
        }

        if (finding.Payload is RequirementFindingPayload requirement)
            return !string.IsNullOrWhiteSpace(requirement.RequirementName);

        if (finding.Payload is AdvisorCostRecommendationFindingPayload advisorCost)
            return !string.IsNullOrWhiteSpace(advisorCost.RecommendationId);

        return false;
    }

    private static bool IsInventoryDrivenEngine(string? engineType) =>
        string.Equals(engineType, "azure-inventory-reconciliation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "aws-inventory-reconciliation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "gcp-inventory-reconciliation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "azure-inventory-security-baseline", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "aws-inventory-security-baseline", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "gcp-inventory-security-baseline", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "orphaned-azure-resource", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "orphaned-aws-resource", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "orphaned-gcp-resource", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "advisor-cost-recommendation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "aws-cost-recommendation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "gcp-cost-recommendation", StringComparison.OrdinalIgnoreCase);
}
