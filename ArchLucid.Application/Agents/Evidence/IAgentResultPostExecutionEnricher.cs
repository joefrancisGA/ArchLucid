using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Runs optional post-LLM enrichment on agent results before persistence.</summary>
public interface IAgentResultPostExecutionEnricher
{
    Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default);
}
