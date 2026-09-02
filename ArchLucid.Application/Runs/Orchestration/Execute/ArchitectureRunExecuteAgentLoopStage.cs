using ArchLucid.Contracts.Metadata;
namespace ArchLucid.Application.Runs.Orchestration.Execute;
public sealed class ArchitectureRunExecuteAgentLoopStage(
  IAgentLoopPrepareStage prepareStage,
  IAgentLoopInvokeStage invokeStage,
  IAgentLoopPersistStage persistStage) : IArchitectureRunExecuteAgentLoopStage {
  public async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(ArchitectureRun run, string runId, string actor, CancellationToken cancellationToken) {
    AgentLoopPreparedBatch prepared = await prepareStage.PrepareAsync(run, runId, actor, cancellationToken);
    using (prepared.GovernanceScope) {
      var results = await invokeStage.InvokeAsync(prepared, cancellationToken);
      return await persistStage.PersistAsync(prepared, results, cancellationToken);
    }
  }
}
