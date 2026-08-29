using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

public sealed partial class EndToEndReplayComparisonService
{
    private async Task AddCompareQualityDeltaAsync(
        EndToEndReplayComparisonReport report,
        string leftRunId,
        string rightRunId,
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureKnowledgeModel? leftModel = await TryLoadModelForRunAsync(scope, leftRunId, cancellationToken);
        ArchitectureKnowledgeModel? rightModel = await TryLoadModelForRunAsync(scope, rightRunId, cancellationToken);

        CompareQualityDeltaCounts? delta = CompareQualityDeltaCalculator.Build(
            leftModel,
            leftFindings,
            rightModel,
            rightFindings);

        if (delta is null)
        {
            report.Warnings.Add(
                "Compare quality delta omitted because one or both architecture knowledge models were unavailable.");
            return;
        }

        report.CompareQualityDelta = delta;
    }

    /// <summary>
    ///     TB-2194: places each correlated finding on the lifecycle spine so the comparison can say which prior findings
    ///     were actually confirmed remediated rather than merely absent from the newer review.
    /// </summary>
    private async Task AddFindingLifecycleAsync(
        EndToEndReplayComparisonReport report,
        ArchitectureRun leftRun,
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings,
        IReadOnlyCollection<AgentResult> leftResults,
        IReadOnlyCollection<AgentResult> rightResults,
        CrossReviewFindingCorrelationResult correlation,
        CancellationToken cancellationToken)
    {
        CrossReviewFindingLifecycleResult lifecycle = await _crossReviewFindingLifecycleService.BuildAsync(
            new CrossReviewFindingLifecycleRequest
            {
                TenantId = _scopeContextProvider.GetCurrentScope().TenantId,
                PriorFindings = leftFindings,
                CurrentFindings = rightFindings,
                Correlation = correlation,
                SourceCoverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(leftResults, rightResults),
                DispositionsSinceUtc =
                    new DateTimeOffset(DateTime.SpecifyKind(leftRun.CreatedUtc, DateTimeKind.Utc)),
            },
            cancellationToken);

        report.FindingLifecycle = lifecycle.Summary;
        report.FindingLifecycleRecords = [.. lifecycle.Records];
    }
}
