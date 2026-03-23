using ArchiForge.Contracts.Agents;

namespace ArchiForge.Data.Repositories;

public interface IAgentExecutionTraceRepository
{
    Task CreateAsync(
        AgentExecutionTrace trace,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns a page of traces for the run ordered by <c>CreatedUtc</c> ascending,
    /// together with the total row count for that run.
    /// </summary>
    Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default);
}
