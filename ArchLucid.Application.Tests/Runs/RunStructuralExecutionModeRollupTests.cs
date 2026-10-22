using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunStructuralExecutionModeRollupTests
{
    [Fact]
    public void TryResolveFromStampedResults_returns_null_when_no_stamped_results()
    {
        StructuralExecutionMode? mode = RunStructuralExecutionModeRollup.TryResolveFromStampedResults(
        [
            new AgentResult { TaskId = "task-a", RunId = "run-1", AgentType = AgentType.Topology },
        ]);

        mode.Should().BeNull();
    }

    [Fact]
    public void TryResolveFromStampedResults_returns_Mixed_for_real_and_simulator_tasks()
    {
        StructuralExecutionMode? mode = RunStructuralExecutionModeRollup.TryResolveFromStampedResults(
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                TaskStructuralExecutionMode = StructuralExecutionMode.Real,
            },
            new AgentResult
            {
                TaskId = "task-b",
                RunId = "run-1",
                AgentType = AgentType.Compliance,
                TaskStructuralExecutionMode = StructuralExecutionMode.Simulator,
            },
        ]);

        mode.Should().Be(StructuralExecutionMode.Mixed);
    }

    [Fact]
    public void TryResolveFromStampedResults_keeps_Real_when_cache_served_on_subset()
    {
        StructuralExecutionMode? mode = RunStructuralExecutionModeRollup.TryResolveFromStampedResults(
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                TaskStructuralExecutionMode = StructuralExecutionMode.Real,
                CacheServed = true,
            },
            new AgentResult
            {
                TaskId = "task-b",
                RunId = "run-1",
                AgentType = AgentType.Compliance,
                TaskStructuralExecutionMode = StructuralExecutionMode.Real,
            },
        ]);

        mode.Should().Be(StructuralExecutionMode.Real);
    }

    [Fact]
    public void TryResolveFromStampedResults_recomputes_after_selective_resume_flip()
    {
        StructuralExecutionMode? mode = RunStructuralExecutionModeRollup.TryResolveFromStampedResults(
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                TaskStructuralExecutionMode = StructuralExecutionMode.Simulator,
            },
            new AgentResult
            {
                TaskId = "task-b",
                RunId = "run-1",
                AgentType = AgentType.Compliance,
                TaskStructuralExecutionMode = StructuralExecutionMode.Real,
            },
        ]);

        mode.Should().Be(StructuralExecutionMode.Mixed);
    }
}
