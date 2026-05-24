using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents.Evidence;

/// <inheritdoc cref="IAgentResultPostExecutionEnricher" />
public sealed class AgentResultPostExecutionEnricher(IAgentCuratedEvidenceProposer evidenceProposer)
    : IAgentResultPostExecutionEnricher
{
    private readonly IAgentCuratedEvidenceProposer _evidenceProposer =
        evidenceProposer ?? throw new ArgumentNullException(nameof(evidenceProposer));

    /// <inheritdoc />
    public async Task EnrichAsync(
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

        foreach (AgentResult result in results)
        {
            string? proposedJson = await _evidenceProposer
                .TryProposeEvidenceJsonAsync(runId, request, evidence, result, cancellationToken)
                .ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(proposedJson))
                continue;

            result.ProposedEvidenceJson = proposedJson;
        }
    }
}
