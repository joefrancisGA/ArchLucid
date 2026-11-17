using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
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
        ArgumentNullException.ThrowIfNull(results);

        IReadOnlyList<AgentResult> enrichableResults = results;

        if (results.Any(static result => result is null))
            enrichableResults = results.Where(static result => result is not null).ToArray();

        foreach (IAgentResultPostExecutionEnricher enricher in _enrichers.Where(static enricher => enricher is not null))
            await enricher.EnrichAsync(runId, request, evidence, enrichableResults, cancellationToken)
                .ConfigureAwait(false);
    }
}
