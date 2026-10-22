using ArchLucid.AgentSimulator.Services;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Suite", "Core")]
public sealed class DeterministicReviewEngineTests
{
    [Fact]
    public async Task ExecuteAsync_delegates_to_deterministic_simulator_and_returns_topology_result()
    {
        DeterministicReviewEngine engine = new();
        ArchitectureRequest request = new()
        {
            RequestId = "req-deterministic",
            Description = new string('x', 12),
            SystemName = "Deterministic Review",
        };
        AgentEvidencePackage evidence = new()
        {
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RequestId = request.RequestId,
            SystemName = request.SystemName,
        };
        AgentTask task = new()
        {
            RunId = evidence.RunId,
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
        };

        IReadOnlyList<AgentResult> results = await engine.ExecuteAsync(
            evidence.RunId,
            request,
            evidence,
            [task]);

        results.Should().HaveCount(1);
        results[0].AgentType.Should().Be(AgentType.Topology);
        results[0].Claims.Should().NotBeEmpty();
    }

    [Fact]
    public void DeterministicReviewEngine_implements_agent_executor_boundary()
    {
        DeterministicReviewEngine engine = new();

        engine.Should().BeAssignableTo<IAgentExecutor>();
    }
}
