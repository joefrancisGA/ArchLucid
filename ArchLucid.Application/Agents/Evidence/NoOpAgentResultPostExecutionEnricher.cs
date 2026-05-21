using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Test/no-op enricher.</summary>
public sealed class NoOpAgentResultPostExecutionEnricher : IAgentResultPostExecutionEnricher
{
    public Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
