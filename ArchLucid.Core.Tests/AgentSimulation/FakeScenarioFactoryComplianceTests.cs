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
}
