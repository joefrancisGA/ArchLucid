using ArchLucid.AgentSimulator.Services;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;
using FluentAssertions.Specialized;

namespace ArchLucid.Application.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeterministicAgentSimulatorExecutionExceptionTests
{
    [Theory]
    [InlineData("9b88cd5f48764170b60737eb9e87a534", "9b88cd5f-4876-4170-b607-37eb9e87a534")]
    [InlineData("9b88cd5f-4876-4170-b607-37eb9e87a534", "9b88cd5f48764170b60737eb9e87a534")]
    public async Task ExecuteAsync_equivalent_guid_formats_belong_to_same_run(
        string runId,
        string taskRunId)
    {
        DeterministicAgentSimulator sut = new();
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod",
        };

        AgentTask task = new() { TaskId = "t", RunId = taskRunId, AgentType = AgentType.Topology };
        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(
            runId, request, new AgentEvidencePackage(), [task]);

        results.Should().ContainSingle();
    }

    [Theory]
    [InlineData("9b88cd5f48764170b60737eb9e87a534", "74b53d15a7f24a2fabbd7d6a2ad56905")]
    [InlineData("9b88cd5f48764170b60737eb9e87a534", "not-a-guid")]
    public async Task ExecuteAsync_rejects_other_run_or_mismatched_identity_type(
        string runId,
        string taskRunId)
    {
        DeterministicAgentSimulator sut = new();
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod",
        };

        AgentTask task = new() { TaskId = "t", RunId = taskRunId, AgentType = AgentType.Topology };
        Func<Task> act = async () =>
            await sut.ExecuteAsync(runId, request, new AgentEvidencePackage(), [task]);

        ExceptionAssertions<AgentHandlerExecutionException> ex =
            await act.Should().ThrowAsync<AgentHandlerExecutionException>();

        ex.Which.InnerException.Should().BeOfType<InvalidOperationException>();
    }

    [Fact]
    public async Task ExecuteAsync_mismatched_run_id_wraps_AgentHandlerExecutionException()
    {
        DeterministicAgentSimulator sut = new();
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod",
        };

        AgentTask task = new() { TaskId = "t", RunId = "other-run", AgentType = AgentType.Topology };

        Func<Task> act = async () =>
            await sut.ExecuteAsync("run-expected", request, new AgentEvidencePackage(), [task]);

        ExceptionAssertions<AgentHandlerExecutionException> ex =
            await act.Should().ThrowAsync<AgentHandlerExecutionException>();

        ex.Which.AgentTypeKey.Should().Be(AgentTypeKeys.Topology);
        ex.Which.InnerException.Should().BeOfType<InvalidOperationException>();
    }
}
