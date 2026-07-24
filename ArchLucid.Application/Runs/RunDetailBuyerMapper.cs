using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Default-deny mapper from operator <see cref="RunDetailDto" /> to buyer proof DTO (TB-283).
/// </summary>
public static class RunDetailBuyerMapper
{
    /// <summary>Maps whitelisted proof fields only — never copies snapshot or agent-result subgraphs.</summary>
    public static BuyerRunDetailSummaryDto Map(RunDetailDto source)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(source.Run);

        RunRecord run = source.Run;

        return new BuyerRunDetailSummaryDto
        {
            Run = new BuyerRunDetailRunDto
            {
                RunId = run.RunId,
                ProjectId = run.ProjectId,
                ScopeProjectId = run.ScopeProjectId,
                Description = run.Description,
                DisplayName = run.Description,
                CreatedUtc = run.CreatedUtc,
                GoldenManifestId = run.GoldenManifestId,
                HasGraphSnapshot = run.GraphSnapshotId.HasValue,
                HasGoldenManifest = run.GoldenManifestId.HasValue,
                HasFindingsSnapshot = run.FindingsSnapshotId.HasValue,
                LegacyRunStatus = run.LegacyRunStatus,
                RunDegradedExecution = source.RunDegradedExecution,
                DegradedExecutionAgents = source.DegradedExecutionAgents,
                IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(run),
            },
            ExecutionFlavorBuyerSummary = source.ExecutionFlavorBuyerSummary,
            RunDegradedExecution = source.RunDegradedExecution,
            DegradedExecutionAgents = source.DegradedExecutionAgents,
            DegradedFindingCoverage = source.DegradedFindingCoverage,
            FindingCoverageSummary = source.FindingCoverageSummary,
            FindingSummaries = MapFindingSummaries(source.FindingsSnapshot),
            AgentExecutionLlmCostEstimate = source.AgentExecutionLlmCostEstimate,
            TrustEvidenceCard = source.TrustEvidenceCard,
            RetrievalGroundingSummary = source.RetrievalGroundingSummary,
            LastAgentExecutionFailure = source.LastAgentExecutionFailure,
            AgentExecutionOutcomes = source.AgentExecutionOutcomes,
            EstimatedUsdSavingsSummary = source.EstimatedUsdSavingsSummary,
            DecisionExplainability = source.DecisionExplainability,
        };
    }

    private static IReadOnlyList<BuyerFindingSummaryDto> MapFindingSummaries(FindingsSnapshot? snapshot)
    {
        if (snapshot?.Findings is null || snapshot.Findings.Count == 0)
            return [];

        return snapshot.Findings
            .Where(static f => !string.IsNullOrWhiteSpace(f.FindingId))
            .Select(static f => new BuyerFindingSummaryDto
            {
                FindingId = f.FindingId.Trim(),
                Title = string.IsNullOrWhiteSpace(f.Title) ? string.Empty : f.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(f.Category) ? string.Empty : f.Category.Trim(),
                Severity = f.Severity,
                EngineType = string.IsNullOrWhiteSpace(f.EngineType) ? string.Empty : f.EngineType.Trim(),
                PolicyRuleId = string.IsNullOrWhiteSpace(f.PolicyRuleId) ? null : f.PolicyRuleId.Trim(),
            })
            .ToList();
    }
}
