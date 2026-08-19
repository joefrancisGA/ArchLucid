using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Capabilities.Cost.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CostAgentHandlerTests
{
    private readonly CostAgentHandler _sut = new();

    [Fact]
    public void AgentType_and_AgentTypeKey_match_cost_agent()
    {
        _sut.AgentType.Should().Be(AgentType.Cost);
        _sut.AgentTypeKey.Should().Be(AgentTypeKeys.Cost);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsDeterministicCostAgentResult()
    {
        const string runId = "run-cost-test";

        ArchitectureRequest request = new()
        {
            Description = "0123456789 requirement text",
            SystemName = "sys"
        };

        AgentEvidencePackage evidence = new();
        AgentTask task = new()
        {
            RunId = runId,
            AgentType = AgentType.Cost,
            Objective = "estimate"
        };

        AgentResult result = await _sut.ExecuteAsync(runId, request, evidence, task, CancellationToken.None);

        result.RunId.Should().Be(runId);
        result.TaskId.Should().Be(task.TaskId);
        result.AgentType.Should().Be(AgentType.Cost);
        result.Claims.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_RequestNull_Throws()
    {
        AgentEvidencePackage evidence = new();

        AgentTask task = new()
        {
            RunId = "r",
            AgentType = AgentType.Cost,
            Objective = "estimate"
        };

        Func<Task> act = async () =>
            await _sut.ExecuteAsync("run", request: null!, evidence, task, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("request");
    }

    [Fact]
    public async Task ExecuteAsync_EvidenceNull_Throws()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 requirement text",
            SystemName = "sys"
        };

        AgentTask task = new()
        {
            RunId = "r",
            AgentType = AgentType.Cost,
            Objective = "estimate"
        };

        Func<Task> act = async () =>
            await _sut.ExecuteAsync("run", request, evidence: null!, task, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("evidence");
    }

    [Fact]
    public async Task ExecuteAsync_TaskNull_Throws()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 requirement text",
            SystemName = "sys"
        };

        AgentEvidencePackage evidence = new();

        Func<Task> act = async () =>
            await _sut.ExecuteAsync("run", request, evidence, task: null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("task");
    }
}
