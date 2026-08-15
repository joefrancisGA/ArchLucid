using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>TB-2227: structural provenance required for decision-grade findings at commit.</summary>
public static class DecisionGradeFindingProvenanceValidator
{
    public static IReadOnlyList<string> GetViolations(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<string> violations = [];

        foreach (Finding finding in snapshot.Findings)
        {
            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            string? violation = GetViolation(finding);

            if (violation is not null)
                violations.Add(violation);
        }

        return violations;
    }

    private static string? GetViolation(Finding finding)
    {
        if (InsightDensityFindingSourceClassifier.IsAgentArchitectureFinding(finding.FindingType))
            return HasAgentCitationProvenance(finding)
                ? null
                : $"Finding '{finding.FindingId}' ({finding.FindingType}) lacks agent citation provenance.";

        return HasTypedEngineProvenance(finding)
            ? null
            : $"Finding '{finding.FindingId}' ({finding.FindingType}) lacks typed-engine provenance.";
    }

    private static bool HasAgentCitationProvenance(Finding finding)
    {
        if (finding.Trace?.Citations is { Count: > 0 } citations
            && citations.Any(static c => !string.IsNullOrWhiteSpace(c)))
            return true;

        return false;
    }

    private static bool HasTypedEngineProvenance(Finding finding)
    {
        if (HasInventoryDrivenEngineProvenance(finding))
            return true;

        bool hasNodes = finding.RelatedNodeIds is { Count: > 0 } nodes
                        && nodes.Any(static n => !string.IsNullOrWhiteSpace(n));

        bool hasRules = finding.Trace?.RulesApplied is { Count: > 0 } rules
                        && rules.Any(static r => !string.IsNullOrWhiteSpace(r));

        if (hasNodes && hasRules)
            return true;

        if (finding.Trace?.Citations is { Count: > 0 } citations
            && citations.Any(static c => !string.IsNullOrWhiteSpace(c)))
            return true;

        return false;
    }

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
        || string.Equals(engineType, "orphaned-gcp-resource", StringComparison.OrdinalIgnoreCase);
}
