using ArchLucid.Contracts.Metadata;
namespace ArchLucid.Application.Runs.Orchestration.Execute;
public interface IAgentLoopPrepareStage {
  Task<AgentLoopPreparedBatch> PrepareAsync(ArchitectureRun run, string runId, string actor, CancellationToken cancellationToken);
}
