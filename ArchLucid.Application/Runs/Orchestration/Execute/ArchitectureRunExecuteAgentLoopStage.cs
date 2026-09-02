using ArchLucid.Core.Runs;
namespace ArchLucid.Application.Runs.Orchestration.Execute;
public sealed class ArchitectureRunExecuteAgentLoopStage(IAgentLoopPrepareStage prepare,IAgentLoopInvokeStage invoke,IAgentLoopPersistStage persist):IArchitectureRunExecuteAgentLoopStage{
  public async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(ArchitectureRun run,string runId,string actor,CancellationToken ct){
    var p=await prepare.PrepareAsync(run,runId,actor,ct); using(p.GovernanceScope){var r=await invoke.InvokeAsync(p,ct); return await persist.PersistAsync(p,r,ct);} }
}
