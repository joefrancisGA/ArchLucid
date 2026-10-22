using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>In-memory / test host stub for TB-110 ledger writes.</summary>
public sealed class NoOpAgentToolInvocationRecordWriter : IAgentToolInvocationRecordWriter
{
    public Task SaveFromTraceAsync(
        AgentExecutionTrace trace,
        int sortOrder,
        int? durationMs,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
