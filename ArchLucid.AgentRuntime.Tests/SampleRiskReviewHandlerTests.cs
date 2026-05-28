using ArchLucid.AgentRuntime.Tests.Fixtures;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SampleRiskReviewHandlerTests
{
    [Fact]
    public async Task Custom_handler_returns_valid_agent_result()
    {
        SampleRiskReviewHandler handler = new();
        AgentTask task = new()
        {
            RunId = "review-1",
            AgentType = AgentType.Critic,
            AgentTypeKey = "sample-risk-review",
        };

        AgentResult result = await handler.ExecuteAsync(
            "review-1",
            new ArchitectureRequest
            {
                RequestId = "req-1",
                SystemName = "Sample",
                Description = "1234567890",
                Environment = "prod",
            },
            new AgentEvidencePackage(),
            task);

        result.AgentType.Should().Be(AgentType.Critic);
        result.Claims.Should().ContainSingle();
        result.ReasoningTrace.Should().Contain("Simulator-safe");
    }
}
