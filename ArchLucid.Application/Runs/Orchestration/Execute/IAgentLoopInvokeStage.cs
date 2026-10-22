using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public interface IAgentLoopInvokeStage
{
    Task<IReadOnlyList<AgentResult>> InvokeAsync(AgentLoopPreparedBatch prepared, CancellationToken cancellationToken);
}
