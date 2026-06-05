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
                Description = run.Description,
                DisplayName = run.Description,
                CreatedUtc = run.CreatedUtc,
                GoldenManifestId = run.GoldenManifestId,
                HasGraphSnapshot = run.GraphSnapshotId.HasValue,
                HasGoldenManifest = run.GoldenManifestId.HasValue,
                HasFindingsSnapshot = run.FindingsSnapshotId.HasValue,
                RunDegradedExecution = source.RunDegradedExecution,
                DegradedExecutionAgents = source.DegradedExecutionAgents,
            },
            ExecutionFlavorBuyerSummary = source.ExecutionFlavorBuyerSummary,
            RunDegradedExecution = source.RunDegradedExecution,
            DegradedExecutionAgents = source.DegradedExecutionAgents,
            DegradedFindingCoverage = source.DegradedFindingCoverage,
            FindingCoverageSummary = source.FindingCoverageSummary,
            AgentExecutionLlmCostEstimate = source.AgentExecutionLlmCostEstimate,
            TrustEvidenceCard = source.TrustEvidenceCard,
            RetrievalGroundingSummary = source.RetrievalGroundingSummary,
            LastAgentExecutionFailure = source.LastAgentExecutionFailure,
            EstimatedUsdSavingsSummary = source.EstimatedUsdSavingsSummary,
            DecisionExplainability = source.DecisionExplainability,
        };
    }
}
