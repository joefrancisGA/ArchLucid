using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class CriticFindingConfidenceNormalizerTests
{
    [Fact]
    public void Apply_sets_low_confidence_when_finding_has_no_evidence_refs()
    {
        AgentResult result = BuildCriticResult(
            new ArchitectureFinding
            {
                FindingId = "f-1",
                EvidenceRefs = [],
            });

        CriticFindingConfidenceNormalizer.Apply(result);

        result.Findings[0].ConfidenceLevel.Should().Be(FindingConfidenceLevel.Low);
    }

    [Fact]
    public void Apply_sets_low_confidence_when_only_generic_evidence_refs_present()
    {
        AgentResult result = BuildCriticResult(
            new ArchitectureFinding
            {
                FindingId = "f-2",
                EvidenceRefs = ["request", "critic-checklist"],
            });

        CriticFindingConfidenceNormalizer.Apply(result);

        result.Findings[0].ConfidenceLevel.Should().Be(FindingConfidenceLevel.Low);
    }

    [Fact]
    public void Apply_preserves_confidence_when_concrete_evidence_ref_present()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-3",
            EvidenceRefs = ["doc:azure-networking-bicep#L42"],
            ConfidenceLevel = FindingConfidenceLevel.High,
        };

        AgentResult result = BuildCriticResult(finding);

        CriticFindingConfidenceNormalizer.Apply(result);

        result.Findings[0].ConfidenceLevel.Should().Be(FindingConfidenceLevel.High);
    }

    private static AgentResult BuildCriticResult(params ArchitectureFinding[] findings)
    {
        return new AgentResult
        {
            ResultId = "r-1",
            TaskId = "t-1",
            RunId = AgentHandlerTestRunIds.Run001,
            AgentType = AgentType.Critic,
            Findings = findings.ToList(),
        };
    }
}
