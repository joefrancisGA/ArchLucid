using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonFindingLifecycleDiffSlice(
    ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService,
    ICrossReviewFindingLifecycleService crossReviewFindingLifecycleService,
    IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess,
    IScopeContextProvider scopeContextProvider) : IReplayComparisonDiffSlice
{
    private readonly ICrossReviewFindingCorrelationService _crossReviewFindingCorrelationService =
        crossReviewFindingCorrelationService ?? throw new ArgumentNullException(nameof(crossReviewFindingCorrelationService));

    private readonly ICrossReviewFindingLifecycleService _crossReviewFindingLifecycleService =
        crossReviewFindingLifecycleService ?? throw new ArgumentNullException(nameof(crossReviewFindingLifecycleService));

    private readonly IArchitectureKnowledgeModelAccess _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess ?? throw new ArgumentNullException(nameof(architectureKnowledgeModelAccess));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        List<ArchitectureFinding> leftFindings = CollectFindings(context.LeftDetail);
        List<ArchitectureFinding> rightFindings = CollectFindings(context.RightDetail);
        List<AgentResult> leftResults = context.LeftDetail.Results;
        List<AgentResult> rightResults = context.RightDetail.Results;
        ArchitectureRun leftRun = context.LeftDetail.Run;

        CrossReviewFindingCorrelationResult correlation = _crossReviewFindingCorrelationService.Correlate(
            leftFindings,
            rightFindings);
        context.Report.FindingCorrelation = ComparisonFindingCorrelationMetadataBuilder.Build(correlation);

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

        context.Report.FindingLifecycle = lifecycle.Summary;
        context.Report.FindingLifecycleRecords = [.. lifecycle.Records];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureKnowledgeModel? leftModel = await TryLoadModelForRunAsync(scope, context.LeftRunId, cancellationToken);
        ArchitectureKnowledgeModel? rightModel = await TryLoadModelForRunAsync(scope, context.RightRunId, cancellationToken);

        CompareQualityDeltaCounts? delta = CompareQualityDeltaCalculator.Build(
            leftModel,
            leftFindings,
            rightModel,
            rightFindings);

        if (delta is null)
        {
            context.Report.Warnings.Add(
                "Compare quality delta omitted because one or both architecture knowledge models were unavailable.");
            return;
        }

        context.Report.CompareQualityDelta = delta;
    }

    private static List<ArchitectureFinding> CollectFindings(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results)
            findings.AddRange(result.Findings);

        return findings;
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadModelForRunAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        return await _architectureKnowledgeModelAccess
            .GetForRunAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
