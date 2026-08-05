using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingTrustLabelEnricherTests
{
    [Fact]
    public void Apply_PopulatesTrustLabelOnEachFinding()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            StructuralExecutionMode = StructuralExecutionMode.Real,
        };
        ArchitectureFinding finding = new()
        {
            PolicyRuleId = "sec-base-001",
            EvidenceRefs = ["ref-1"],
        };
        AgentResult result = new()
        {
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };
        Mock<IFindingTrustLabelMapper> mapper = new();
        mapper
            .Setup(m => m.Map(finding, It.IsAny<AgentTrustContext>()))
            .Returns(new FindingTrustSummary(FindingTrustLabel.DeterministicRule, "Rule fired."));

        FindingTrustLabelEnricher.Apply(run, [result], mapper.Object);

        finding.TrustLabel.Should().Be(nameof(FindingTrustLabel.DeterministicRule));
        finding.TrustLabelReason.Should().Be("Rule fired.");
    }

    [Fact]
    public void Apply_SimulatorRun_MarksSimulatorDerivedContext()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };
        ArchitectureFinding finding = new() { EvidenceRefs = ["ref-1"] };
        AgentResult result = new() { AgentType = AgentType.Compliance, Findings = [finding] };
        AgentTrustContext? capturedContext = null;
        Mock<IFindingTrustLabelMapper> mapper = new();
        mapper
            .Setup(m => m.Map(finding, It.IsAny<AgentTrustContext>()))
            .Callback<ArchitectureFinding, AgentTrustContext>((_, context) => capturedContext = context)
            .Returns(new FindingTrustSummary(FindingTrustLabel.SimulatorDerived, "Simulator."));

        FindingTrustLabelEnricher.Apply(run, [result], mapper.Object);

        capturedContext.Should().NotBeNull();
        capturedContext!.IsSimulatorDerived.Should().BeTrue();
        finding.TrustLabel.Should().Be(nameof(FindingTrustLabel.SimulatorDerived));
    }
}
