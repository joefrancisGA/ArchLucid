using ArchLucid.AgentSimulator.Services;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;
using FluentAssertions.Specialized;

namespace ArchLucid.Application.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeterministicAgentSimulatorExecutionExceptionTests
{
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
