using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Strips prose-only agent findings before persistence (TB-2222).</summary>
public sealed class AgentArchitectureFindingEmissionEnricher : IAgentResultPostExecutionEnricher
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

        AgentArchitectureFindingEmissionGate.ApplyToResults(results);

        return Task.CompletedTask;
    }
}
