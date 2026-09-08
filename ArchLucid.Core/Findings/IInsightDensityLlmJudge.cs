using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Optional Premium-tier LLM pass that enriches promoted findings with TB-382 judgment fields (Phase 2).
/// </summary>
public interface IInsightDensityLlmJudge
{
    Task<InsightDensityLlmJudgeApplyResult> ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);

    Task<InsightDensityLlmJudgeApplyResult> ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default);
}
