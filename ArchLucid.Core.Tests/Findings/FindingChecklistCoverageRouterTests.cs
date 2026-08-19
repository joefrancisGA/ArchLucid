using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class FindingChecklistCoverageRouterTests
{
    [Fact]
    public void Apply_moves_demoted_findings_out_of_findings_list()
    {
        Finding demoted = new()
        {
            FindingId = "check-1",
            FindingType = "SecurityControlFinding",
            Category = "Security",
            EngineType = "Test",
            Title = "Enable MFA",
            Rationale = "Enable MFA",
            Treatment = FindingTreatment.DemoteToChecklist,
            Classification = FindingClassification.ChecklistCoverage,
        };

        Finding retained = new()
        {
            FindingId = "keep-1",
            FindingType = "RequirementFinding",
            Category = "Requirement",
            EngineType = "Test",
            Title = "SecretManagementUnderSpecified",
            Rationale = "SecretManagementUnderSpecified",
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
        };

        FindingsSnapshot snapshot = new()
        {
            Findings = [demoted, retained],
        };

        FindingChecklistCoverageRouter.Apply(snapshot);

        snapshot.Findings.Should().ContainSingle().Which.FindingId.Should().Be("keep-1");
        snapshot.ChecklistCoverage.Should().ContainSingle().Which.FindingId.Should().Be("check-1");
        snapshot.InsightDensityCuration!.DemotedToChecklistCount.Should().Be(1);
        snapshot.InsightDensityCuration.RetainedFindingCount.Should().Be(1);
    }
}
