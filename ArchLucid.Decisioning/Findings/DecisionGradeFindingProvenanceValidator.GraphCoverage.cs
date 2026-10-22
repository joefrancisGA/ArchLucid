using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Decisioning.Findings;

public static partial class DecisionGradeFindingProvenanceValidator
{
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

    private static bool IsGraphCoverageEngine(string? engineType) =>
        string.Equals(engineType, "policy-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "topology-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "requirement-coverage", StringComparison.OrdinalIgnoreCase)
        || string.Equals(engineType, "security-coverage", StringComparison.OrdinalIgnoreCase);
}
