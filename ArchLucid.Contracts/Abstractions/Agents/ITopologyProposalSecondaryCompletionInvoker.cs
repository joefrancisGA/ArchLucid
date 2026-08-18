using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Contracts.Abstractions.Agents;

public interface ITopologyProposalSecondaryCompletionInvoker
{
    Task<AgentTopologyProposal?> InvokeSecondaryAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask topologyTask,
        CancellationToken cancellationToken = default);
}
