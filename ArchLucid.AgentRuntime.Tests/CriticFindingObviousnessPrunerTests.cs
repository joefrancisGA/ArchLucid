using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class CriticFindingObviousnessPrunerTests
{
    private static readonly IInsightDensityGate Gate = DeterministicInsightDensityGate.CreateDefault();

    [Fact]
    public void Apply_retains_obvious_generic_advice_as_advisory_instead_of_removing()
    {
        AgentResult result = BuildCriticResult(
            new ArchitectureFinding
            {
                FindingId = "f-generic-mfa",
                Severity = FindingSeverity.Error,
                Message = "Enable MFA for all user accounts.",
                EvidenceRefs = ["critic-checklist"],
            },
            new ArchitectureFinding
            {
                FindingId = "f-specific",
                Severity = FindingSeverity.Warning,
                Message = "ObservabilityUnderSpecified",
                EvidenceRefs = ["doc:azure-networking-bicep#L42"],
            });

        CriticFindingObviousnessPruner.Apply(result, Gate);

        result.Findings.Should().HaveCount(2);
        result.Findings.Should().ContainSingle(f =>
            f.FindingId == "f-generic-mfa" &&
            f.EnforcementTier == FindingEnforcementTier.Advisory);
        result.Findings.Should().ContainSingle(f =>
            f.FindingId == "f-specific" &&
            f.EnforcementTier == FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void Apply_preserves_obvious_advice_when_named_service_anchors_the_message()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-mfa-checkout",
            Severity = FindingSeverity.Error,
            Message = "Enable MFA on CheckoutApi before production rollout.",
            EvidenceRefs = ["request"],
            ConfidenceLevel = FindingConfidenceLevel.Medium,
        };

        AgentResult result = BuildCriticResult(finding);

        CriticFindingObviousnessPruner.Apply(result, Gate);

        result.Findings.Should().HaveCount(1);
        result.Findings[0].Severity.Should().Be(FindingSeverity.Error);
        result.Findings[0].ConfidenceLevel.Should().Be(FindingConfidenceLevel.Medium);
        result.Findings[0].EnforcementTier.Should().Be(FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void Apply_preserves_architecture_specific_under_specified_findings()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-obs",
            Severity = FindingSeverity.Warning,
            Message = "SecretManagementUnderSpecified",
            EvidenceRefs = ["doc:manifest.json#services"],
        };

        AgentResult result = BuildCriticResult(finding);

        CriticFindingObviousnessPruner.Apply(result, Gate);

        result.Findings.Should().HaveCount(1);
        result.Findings[0].Severity.Should().Be(FindingSeverity.Warning);
        result.Findings[0].EnforcementTier.Should().Be(FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void Apply_no_op_for_non_critic_results()
    {
        AgentResult result = new()
        {
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "f-1",
                    Message = "Enable MFA for all users.",
                },
            ],
        };

        CriticFindingObviousnessPruner.Apply(result, Gate);

        result.Findings.Should().HaveCount(1);
    }

    [Theory]
    [InlineData("Use HTTPS for all public endpoints.")]
    [InlineData("Implement encryption at rest for all data stores.")]
    [InlineData("Follow security best practices for Azure workloads.")]
    [InlineData("Apply defense in depth across all tiers.")]
    [InlineData("Align with the Azure Well-Architected Framework.")]
    public void IsObviousGenericAdvice_detects_checklist_phrasing(string message)
    {
        CriticFindingObviousnessPatterns.IsObviousGenericAdvice(message).Should().BeTrue();
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
