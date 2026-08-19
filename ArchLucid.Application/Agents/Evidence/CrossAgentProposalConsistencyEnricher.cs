using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Applies cross-agent proposal consistency rules before persistence.</summary>
public sealed class CrossAgentProposalConsistencyEnricher : IAgentResultPostExecutionEnricher
{
    /// <inheritdoc />
    public Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(results);

        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        return Task.CompletedTask;
    }
}
