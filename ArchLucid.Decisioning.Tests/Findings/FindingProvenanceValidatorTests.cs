using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingProvenanceValidatorTests
{
    private readonly FindingProvenanceValidator _sut = new();

    [Fact]
    public void GetEmissionViolation_exempts_checklist_coverage()
    {
        Finding finding = new()
        {
            FindingId = "check-1",
            FindingType = "TopologyGap",
            Category = "Topology",
            Classification = FindingClassification.ChecklistCoverage,
        };

        _sut.GetEmissionViolation(finding).Should().BeNull();
    }

    [Fact]
    public void GetEmissionViolation_exempts_agent_architecture_findings()
    {
        Finding finding = new()
        {
            FindingId = "agent-1",
            FindingType = "AgentArchitectureFinding-Compliance",
            Category = "Compliance",
            Trace = new ExplainabilityTrace(),
        };

        _sut.GetEmissionViolation(finding).Should().BeNull();
    }

    [Fact]
    public void GetEmissionViolation_requires_typed_engine_nodes_and_rules()
    {
        Finding finding = new()
        {
            FindingId = "engine-1",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "topology-gap",
        };

        _sut.GetEmissionViolation(finding)
            .Should().Contain("engine-1");
    }

    [Fact]
    public void GetEmissionViolation_allows_typed_engine_with_nodes_and_rules()
    {
        Finding finding = new()
        {
            FindingId = "engine-1",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "topology-gap",
            RelatedNodeIds = ["node-1"],
            Trace = new ExplainabilityTrace { RulesApplied = ["topology-gap-rule"] },
        };

        _sut.GetEmissionViolation(finding).Should().BeNull();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingProvenanceEmissionApplicatorTests
{
    [Fact]
    public void Apply_holds_typed_finding_without_kind_a_in_checklist_band()
    {
        Finding finding = new()
        {
            FindingId = "engine-1",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "topology-gap",
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
        };

        Mock<IFindingProvenanceValidator> validator = new(MockBehavior.Strict);
        validator
            .Setup(v => v.GetEmissionViolation(finding))
            .Returns("Finding 'engine-1' (TopologyGap) lacks typed-engine provenance.");

        FindingProvenanceEmissionApplicator.Apply([finding], validator.Object);

        finding.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        finding.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        finding.Trace!.Notes.Should().ContainSingle(note => note.StartsWith("provenance-hold:", StringComparison.Ordinal));
    }

    [Fact]
    public void Apply_leaves_provenance_complete_finding_unchanged()
    {
        Finding finding = new()
        {
            FindingId = "engine-1",
            FindingType = "TopologyGap",
            Category = "Topology",
            EngineType = "topology-gap",
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            RelatedNodeIds = ["node-1"],
            Trace = new ExplainabilityTrace { RulesApplied = ["topology-gap-rule"] },
        };

        Mock<IFindingProvenanceValidator> validator = new(MockBehavior.Strict);
        validator.Setup(v => v.GetEmissionViolation(finding)).Returns((string?)null);

        FindingProvenanceEmissionApplicator.Apply([finding], validator.Object);

        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        finding.Treatment.Should().Be(FindingTreatment.Promote);
    }
}
