using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class DecisionGradeFindingProvenanceValidatorTests
{
    [Fact]
    public void GetViolations_exempts_checklist_coverage()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "check-1",
                    FindingType = "Hygiene",
                    Category = "Checklist",
                    Classification = FindingClassification.ChecklistCoverage,
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_requires_agent_citations()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "agent-1",
                    FindingType = "AgentArchitectureFinding-Compliance",
                    Category = "Compliance",
                    Trace = new ExplainabilityTrace(),
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot)
            .Should().ContainSingle(v => v.Contains("agent-1"));
    }

    [Fact]
    public void GetViolations_allows_typed_engine_with_nodes_and_rules()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "engine-1",
                    FindingType = "TopologyGap",
                    Category = "Topology",
                    RelatedNodeIds = ["node-1"],
                    Trace = new ExplainabilityTrace { RulesApplied = ["topology-gap-rule"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }
}
