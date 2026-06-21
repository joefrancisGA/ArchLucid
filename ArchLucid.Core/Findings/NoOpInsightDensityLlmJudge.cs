using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.Findings;

/// <summary>Phase 1 fallback when the premium LLM judge is disabled or unconfigured.</summary>
public sealed class NoOpInsightDensityLlmJudge : IInsightDensityLlmJudge
{
    public static NoOpInsightDensityLlmJudge Instance { get; } = new();

    public Task ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
