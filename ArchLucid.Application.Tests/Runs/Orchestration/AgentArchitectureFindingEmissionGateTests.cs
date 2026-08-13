using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentArchitectureFindingEmissionGateTests
{
    [Fact]
    public void HasTypedEmission_allows_checklist_coverage_without_evidence_refs()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.ChecklistCoverage,
            Message = "Tagging hygiene gap",
        };

        AgentArchitectureFindingEmissionGate.HasTypedEmission(finding).Should().BeTrue();
    }

    [Fact]
    public void HasTypedEmission_rejects_prose_only_decision_grade_finding()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Unreferenced compliance concern",
        };

        AgentArchitectureFindingEmissionGate.HasTypedEmission(finding).Should().BeFalse();
    }

    [Fact]
    public void ApplyToResults_strips_prose_only_findings()
    {
        AgentResult result = new()
        {
            AgentType = AgentType.Compliance,
            Findings =
            [
                new ArchitectureFinding
                {
                    Classification = FindingClassification.DecisionGradeFinding,
                    Message = "Prose only",
                },
                new ArchitectureFinding
                {
                    Classification = FindingClassification.DecisionGradeFinding,
                    Message = "Typed",
                    EvidenceRefs = ["evidence:control-1"],
                },
            ],
        };

        AgentArchitectureFindingEmissionGate.ApplyToResults([result]);

        result.Findings.Should().ContainSingle();
        result.Findings[0].Message.Should().Be("Typed");
    }
}
