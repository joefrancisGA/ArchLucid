using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Simulator and test hosts register topology handlers only in real-agent mode; consensus enricher still resolves.
/// </summary>
public sealed class NullTopologyProposalSecondaryCompletionInvoker : ITopologyProposalSecondaryCompletionInvoker
{
    public Task<AgentTopologyProposal?> InvokeSecondaryAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask topologyTask,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<AgentTopologyProposal?>(null);
}
