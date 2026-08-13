using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Runs deterministic structural post-processors on agent proposals before persistence.</summary>
public sealed class AgentProposalStructuralPostProcessorEnricher : IAgentResultPostExecutionEnricher
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

        AgentProposalStructuralPostProcessor.ApplyToResults(results);

        return Task.CompletedTask;
    }
}
