using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public interface IAgentLoopPersistStage
{
    Task<ExecuteRunResult> PersistAsync(AgentLoopPreparedBatch prepared, IReadOnlyList<AgentResult> results, CancellationToken cancellationToken);
}
