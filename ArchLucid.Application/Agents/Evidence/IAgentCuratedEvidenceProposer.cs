using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Optional second LLM pass that proposes catalog evidence gaps from an agent result.</summary>
public interface IAgentCuratedEvidenceProposer
{
    Task<string?> TryProposeEvidenceJsonAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentResult result,
        CancellationToken cancellationToken = default);
}
