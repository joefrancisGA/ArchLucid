using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingInspectTrustLabelEnricherTests
{
    [Fact]
    public void Enrich_SetsTrustLabelForPolicyRuleFinding()
    {
        FindingInspectResponse response = new()
        {
            FindingId = "f-1",
            DecisionRuleId = "rule-1",
            Evidence = [],
            RunStructuralExecutionMode = StructuralExecutionMode.Real,
        };

        FindingInspectResponse enriched = FindingInspectTrustLabelEnricher.Enrich(response, new FindingTrustLabelMapper());

        enriched.TrustLabel.Should().Be(nameof(FindingTrustLabel.DeterministicRule));
        enriched.TrustLabelReason.Should().Contain("deterministic policy rule");
    }

    [Fact]
    public void Enrich_SimulatorRun_UsesSimulatorDerivedTrustLabel()
    {
        FindingInspectResponse response = new()
        {
            FindingId = "f-sim",
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "node-1" }],
            RunStructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        FindingInspectResponse enriched = FindingInspectTrustLabelEnricher.Enrich(response, new FindingTrustLabelMapper());

        enriched.TrustLabel.Should().Be(nameof(FindingTrustLabel.SimulatorDerived));
    }

    [Fact]
    public void Enrich_DegradedRealRunWithoutPolicyRule_UsesDeterministicFallback()
    {
        FindingInspectResponse response = new()
        {
            FindingId = "f-degraded",
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "node-1" }],
            RunStructuralExecutionMode = StructuralExecutionMode.Real,
            ModelDeploymentName = $"{AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix}gpt-4",
        };

        FindingInspectResponse enriched = FindingInspectTrustLabelEnricher.Enrich(response, new FindingTrustLabelMapper());

        enriched.TrustLabel.Should().Be(nameof(FindingTrustLabel.DeterministicFallback));
    }
}
