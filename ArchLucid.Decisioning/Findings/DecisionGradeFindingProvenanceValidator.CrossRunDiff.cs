using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Decisioning.Findings;

public static partial class DecisionGradeFindingProvenanceValidator
{
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
}
