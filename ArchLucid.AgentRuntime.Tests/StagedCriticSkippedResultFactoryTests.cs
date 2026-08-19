using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StagedCriticSkippedResultFactoryTests
{
    [Fact]
    public void CreateSkippedResults_builds_zero_confidence_critic_rows()
    {
        List<AgentTask> tasks =
        [
            new()
            {
                TaskId = "critic-1",
                RunId = "run-1",
                AgentType = AgentType.Critic,
                Objective = "review",
                Status = AgentTaskStatus.Created,
            },
        ];

        AgentResult[] results = StagedCriticSkippedResultFactory.CreateSkippedResults("run-1", tasks, timeoutSeconds: 90);

        results.Should().HaveCount(1);
        results[0].TaskId.Should().Be("critic-1");
        results[0].RunId.Should().Be("run-1");
        results[0].AgentType.Should().Be(AgentType.Critic);
        results[0].Confidence.Should().Be(0);
        results[0].Claims.Should().ContainSingle(c => c.Contains("90s", StringComparison.Ordinal));
    }
}
