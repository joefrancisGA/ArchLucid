using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Optional Premium-tier LLM pass that enriches promoted findings with TB-382 judgment fields (Phase 2).
/// </summary>
public interface IInsightDensityLlmJudge
{
    Task<int> ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);

    Task<int> ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default);
}
