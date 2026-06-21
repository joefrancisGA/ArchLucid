using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecuteIdempotentResultPolicyTests
{
    [Fact]
    public void ShouldSkipRetry_returns_true_for_non_degraded_result_with_claims()
    {
        AgentResult result = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Claims = ["done"],
        };

        AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(result, out string? reason).Should().BeTrue();
        reason.Should().Be(AgentExecuteIdempotentSkipReasonCodes.PersistedSuccessfulResult);
    }

    [Fact]
    public void ShouldSkipRetry_returns_false_for_degraded_result()
    {
        AgentResult result = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Claims = ["placeholder"],
            DegradationReasonCode = AgentHandlerDegradationReasonCodes.CircuitOpen,
        };

        AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(result, out _).Should().BeFalse();
    }

    [Fact]
    public void ShouldSkipRetry_returns_false_for_empty_meaningless_result()
    {
        AgentResult result = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
        };

        AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(result, out _).Should().BeFalse();
    }
}
