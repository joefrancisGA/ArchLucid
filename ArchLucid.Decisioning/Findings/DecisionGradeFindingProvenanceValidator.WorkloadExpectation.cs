using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Decisioning.Findings;

public static partial class DecisionGradeFindingProvenanceValidator
{
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
}
