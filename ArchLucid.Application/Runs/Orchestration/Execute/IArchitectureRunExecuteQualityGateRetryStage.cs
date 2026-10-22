using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Quality-gate auto-retry execution for a single rejected agent result.
/// </summary>
public interface IArchitectureRunExecuteQualityGateRetryStage
{
    Task<List<AgentResult>> RetryQualityGateRejectedAgentAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> currentResults,
        AgentOutputQualityGateRejectedException rejection,
        CancellationToken cancellationToken);
}
