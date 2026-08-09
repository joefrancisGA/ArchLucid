using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultTaskExecutionModePersistStamperTests
{
    [Fact]
    public void EnsureStamped_preserves_runtime_cache_flag_on_real_host()
    {
        AgentResult result = new()
        {
            TaskId = "task-a",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            TaskStructuralExecutionMode = StructuralExecutionMode.Real,
            CacheServed = true,
        };

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            result,
            new AgentExecutionOptions { Mode = "Real" },
            realModeFellBackToSimulator: false,
            isSimulatorHostExecutor: false);

        result.TaskStructuralExecutionMode.Should().Be(StructuralExecutionMode.Real);
        result.CacheServed.Should().BeTrue();
    }

    [Fact]
    public void EnsureStamped_maps_simulator_host_with_fallback_to_Fallback()
    {
        AgentResult result = new()
        {
            TaskId = "task-a",
            RunId = "run-1",
            AgentType = AgentType.Topology,
        };

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            result,
            new AgentExecutionOptions { Mode = "Simulator" },
            realModeFellBackToSimulator: true,
            isSimulatorHostExecutor: true);

        result.TaskStructuralExecutionMode.Should().Be(StructuralExecutionMode.Fallback);
    }

    [Fact]
    public void EnsureStamped_upgrades_legacy_simulator_stamp_when_run_fell_back()
    {
        AgentResult result = new()
        {
            TaskId = "task-a",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            TaskStructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            result,
            new AgentExecutionOptions { Mode = "Simulator" },
            realModeFellBackToSimulator: true,
            isSimulatorHostExecutor: true);

        result.TaskStructuralExecutionMode.Should().Be(StructuralExecutionMode.Fallback);
    }
}
