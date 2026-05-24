using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Runs all registered post-LLM enrichers in registration order.</summary>
public sealed class CompositeAgentResultPostExecutionEnricher(IEnumerable<IAgentResultPostExecutionEnricher> enrichers)
    : IAgentResultPostExecutionEnricher
{
    private readonly IReadOnlyList<IAgentResultPostExecutionEnricher> _enrichers =
        enrichers?.ToList() ?? throw new ArgumentNullException(nameof(enrichers));

    /// <inheritdoc />
    public async Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default)
    {
        foreach (IAgentResultPostExecutionEnricher enricher in _enrichers)
            await enricher.EnrichAsync(runId, request, evidence, results, cancellationToken).ConfigureAwait(false);
    }
}
