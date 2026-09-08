using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.Findings;

/// <summary>Phase 1 fallback when the premium LLM judge is disabled or unconfigured.</summary>
public sealed class NoOpInsightDensityLlmJudge : IInsightDensityLlmJudge
{
    public static NoOpInsightDensityLlmJudge Instance { get; } = new();

    public Task<int> ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(0);

    public Task<int> ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(0);
}
