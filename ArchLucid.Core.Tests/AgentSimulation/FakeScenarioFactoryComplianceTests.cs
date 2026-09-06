using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentSimulation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentSimulation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeScenarioFactoryComplianceTests
{
    [Fact]
    public void CreateComplianceResult_does_not_add_encryption_control_for_negated_constraint()
    {
        ArchitectureRequest request = new()
        {
            Constraints = ["non-encryption allowed"],
        };

        AgentResult result = FakeScenarioFactory.CreateComplianceResult("run-1", "task-1", request);

        result.ProposedChanges!.RequiredControls.Should().NotContain("Encryption At Rest");
    }

    [Fact]
    public void CreateComplianceResult_does_not_add_managed_identity_control_for_negated_constraint()
    {
        ArchitectureRequest request = new()
        {
            Constraints = ["non-managed identity acceptable"],
        };

        AgentResult result = FakeScenarioFactory.CreateComplianceResult("run-1", "task-1", request);

        result.ProposedChanges!.RequiredControls.Should().NotContain("Managed Identity");
        result.Findings.Should().NotContain(f => f.Message == "ManagedIdentityRequired");
    }

    [Fact]
    public void CreateComplianceResult_does_not_emit_private_networking_finding_for_negated_constraint()
    {
        ArchitectureRequest request = new()
        {
            Constraints = ["non-private networking allowed"],
        };

        AgentResult result = FakeScenarioFactory.CreateComplianceResult("run-1", "task-1", request);

        result.ProposedChanges!.RequiredControls.Should().NotContain("Private Endpoints");
        result.Findings.Should().NotContain(f => f.Message == "PrivateNetworkingRequired");
    }

    [Fact]
    public void CreateComplianceResult_includes_controls_when_constraints_are_affirmative()
    {
        ArchitectureRequest request = new()
        {
            Constraints =
            [
                "Use managed identity",
                "Private endpoints required",
            ],
        };

        AgentResult result = FakeScenarioFactory.CreateComplianceResult("run-1", "task-1", request);

        result.ProposedChanges!.RequiredControls.Should().Contain("Managed Identity");
        result.ProposedChanges!.RequiredControls.Should().Contain("Private Endpoints");
    }
}
