using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
namespace ArchLucid.Application.Runs.Orchestration.Execute;
public sealed class AgentLoopPreparedBatch {
  public required ArchitectureRun Run { get; init; }
  public required string RunId { get; init; }
  public required string Actor { get; init; }
  public required ArchitectureRequest Request { get; init; }
  public required IReadOnlyList<AgentTask> Tasks { get; init; }
  public required AgentEvidencePackage Evidence { get; init; }
  public required string ScheduledTaskIds { get; init; }
  public required IDisposable GovernanceScope { get; init; }
}
