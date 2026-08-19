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

        if (HasGraphCoverageEngineProvenance(finding))
            return true;

        if (HasWorkloadExpectationEngineProvenance(finding))
            return true;

        if (HasCrossRunDiffEngineProvenance(finding))
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

    private static bool HasGraphCoverageEngineProvenance(Finding finding)
    {
        if (!IsGraphCoverageEngine(finding.EngineType))
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

        if (finding.Payload is PolicyCoverageFindingPayload)
            return true;

        if (finding.Payload is TopologyCoverageFindingPayload)
            return true;

        if (finding.Payload is RequirementCoverageFindingPayload requirement)
        {
            return requirement.UncoveredRequirementCount > 0
                   || requirement.UncoveredRequirements.Any(static id => !string.IsNullOrWhiteSpace(id));
        }

        if (finding.Payload is SecurityCoverageFindingPayload security)
        {
            return security.UnprotectedResourceCount > 0
                   || security.UnprotectedResources.Any(static id => !string.IsNullOrWhiteSpace(id));
        }

        return false;
    }

    private static bool HasWorkloadExpectationEngineProvenance(Finding finding)
    {
        if (!IsWorkloadExpectationEngine(finding.EngineType))
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

        if (finding.Payload is RequirementExpectationFindingPayload requirement)
        {
            return requirement.TopologyNodeCount > 0
                   || requirement.MissingThemes.Any(static theme => !string.IsNullOrWhiteSpace(theme));
        }

        if (finding.Payload is SecurityBaselineExpectationFindingPayload security)
        {
            return security.TopologyNodeCount > 0
                   || security.MissingCategories.Any(static category => !string.IsNullOrWhiteSpace(category));
        }

        if (finding.Payload is SecurityBaselineCompletenessFindingPayload completeness)
        {
            return completeness.TopologyNodeCount > 0
                   || completeness.MissingControlFamilies.Any(static family => !string.IsNullOrWhiteSpace(family));
        }

        return false;
    }

    private static bool IsWorkloadExpectationEngine(string? engineType) =>
        string.Equals(engineType, "requirement-expectation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "security-baseline-expectation", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "security-baseline-completeness", StringComparison.OrdinalIgnoreCase);

    private static bool HasCrossRunDiffEngineProvenance(Finding finding)
    {
        if (!IsCrossRunDiffEngine(finding.EngineType))
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

        if (finding.Payload is TopologyGapFindingPayload gap)
            return !string.IsNullOrWhiteSpace(gap.GapCode);

        if (finding.Payload is RequirementCoverageFindingPayload requirement)
        {
            return requirement.UncoveredRequirementCount > 0
                   || requirement.UncoveredRequirements.Any(static id => !string.IsNullOrWhiteSpace(id));
        }

        if (finding.Payload is TopologyCoverageFindingPayload topology)
        {
            return topology.TopologyNodeCount > 0
                   || topology.PresentCategories.Any(static category => !string.IsNullOrWhiteSpace(category))
                   || topology.ExpectedCategories.Any(static category => !string.IsNullOrWhiteSpace(category));
        }

        return false;
    }

    private static bool IsCrossRunDiffEngine(string? engineType) =>
        string.Equals(engineType, "requirement-cross-run-diff", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "topology-cross-run-diff", StringComparison.OrdinalIgnoreCase);

    private static bool IsGraphCoverageEngine(string? engineType) =>
        string.Equals(engineType, "policy-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "topology-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "requirement-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "security-coverage", StringComparison.OrdinalIgnoreCase);

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
