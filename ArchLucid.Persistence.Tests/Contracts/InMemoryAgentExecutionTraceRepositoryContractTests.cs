using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAgentExecutionTraceRepositoryContractTests : AgentExecutionTraceRepositoryContractTests
{
    protected override IAgentExecutionTraceRepository CreateRepository()
    {
        return new InMemoryAgentExecutionTraceRepository();
    }

    [Fact]
    public async Task CreateAsync_keeps_previous_trace_when_replacement_cannot_be_serialized()
    {
        IAgentExecutionTraceRepository repository = CreateRepository();
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletionTemperature = 0.25f,
        };
        await repository.CreateAsync(trace, CancellationToken.None);

        trace.CompletionTemperature = float.NaN;
        await Assert.ThrowsAsync<ArgumentException>(() => repository.CreateAsync(trace, CancellationToken.None));

        AgentExecutionTrace? stored = await repository.GetByTraceIdAsync(trace.TraceId, CancellationToken.None);
        Assert.NotNull(stored);
        Assert.Equal(0.25f, stored.CompletionTemperature);
    }
}
