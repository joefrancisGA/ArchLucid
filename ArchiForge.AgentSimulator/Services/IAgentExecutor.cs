using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Requests;

namespace ArchiForge.AgentSimulator.Services;

public interface IAgentExecutor
{
    Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default);
}
