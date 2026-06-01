using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Writes structured tool-invocation ledger rows from agent traces (TB-110).</summary>
public interface IAgentToolInvocationRecordWriter
{
    Task SaveFromTraceAsync(
        AgentExecutionTrace trace,
        int sortOrder,
        int? durationMs,
        CancellationToken cancellationToken = default);
}
