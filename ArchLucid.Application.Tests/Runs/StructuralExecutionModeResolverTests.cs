using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuralExecutionModeResolverTests
{
    [Fact]
    public void FromAgentExecutionOptionsAndFallback_prefers_fallback_when_flag_set()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Real" },
            realModeFellBackToSimulator: true);

        mode.Should().Be(StructuralExecutionMode.Fallback);
    }

    [Fact]
    public void FromAgentExecutionOptionsAndFallback_maps_real_mode_without_fallback()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Real" },
            realModeFellBackToSimulator: false);

        mode.Should().Be(StructuralExecutionMode.Real);
    }

    [Fact]
    public void FromAgentExecutionOptionsAndFallback_defaults_to_simulator()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Simulator" },
            realModeFellBackToSimulator: false);

        mode.Should().Be(StructuralExecutionMode.Simulator);
    }

    [Fact]
    public void AggregateFromFinalTaskOutcomes_returns_null_when_no_final_tasks()
    {
        StructuralExecutionMode? mode = StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes(
            Array.Empty<TaskExecutionModeOutcome>());

        mode.Should().BeNull();
    }

    [Theory]
    [InlineData(StructuralExecutionMode.Real)]
    [InlineData(StructuralExecutionMode.Simulator)]
    [InlineData(StructuralExecutionMode.Fallback)]
    public void AggregateFromFinalTaskOutcomes_returns_homogeneous_mode_for_single_task(StructuralExecutionMode taskMode)
    {
        StructuralExecutionMode? mode = StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes(
            [new TaskExecutionModeOutcome("task-a", taskMode)]);

        mode.Should().Be(taskMode);
    }

    [Fact]
    public void AggregateFromFinalTaskOutcomes_returns_real_when_all_tasks_real_including_cache_served()
    {
        StructuralExecutionMode? mode = StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes(
        [
            new TaskExecutionModeOutcome("task-a", StructuralExecutionMode.Real, CacheServed: true),
            new TaskExecutionModeOutcome("task-b", StructuralExecutionMode.Real),
        ]);

        mode.Should().Be(StructuralExecutionMode.Real);
    }

    [Theory]
    [InlineData(StructuralExecutionMode.Real, StructuralExecutionMode.Simulator)]
    [InlineData(StructuralExecutionMode.Real, StructuralExecutionMode.Fallback)]
    [InlineData(StructuralExecutionMode.Simulator, StructuralExecutionMode.Fallback)]
    public void AggregateFromFinalTaskOutcomes_returns_mixed_for_heterogeneous_final_tasks(
        StructuralExecutionMode first,
        StructuralExecutionMode second)
    {
        StructuralExecutionMode? mode = StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes(
        [
            new TaskExecutionModeOutcome("task-a", first),
            new TaskExecutionModeOutcome("task-b", second),
        ]);

        mode.Should().Be(StructuralExecutionMode.Mixed);
    }
}
