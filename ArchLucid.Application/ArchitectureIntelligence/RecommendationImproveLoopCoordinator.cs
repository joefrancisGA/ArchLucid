using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Human-selected recommendation apply → change impact → incremental re-review (Improve loop).
/// </summary>
public interface IRecommendationImproveLoopCoordinator
{
    Task<RecommendationImproveLoopResult?> TryApplyAsync(
        RecommendationRecord recommendation,
        CancellationToken cancellationToken = default);
}

public sealed class RecommendationImproveLoopResult
{
    public ArchitectureModelDiff Diff
    {
        get;
        init;
    } = new();

    public ChangeImpactResult? Impact
    {
        get;
        init;
    }

    public IncrementalReReviewResult? ReReview
    {
        get;
        init;
    }

    public string? PartialScopeDisclaimer
    {
        get;
        init;
    }
}

public sealed class RecommendationImproveLoopCoordinator(
    IScopeContextProvider scopeContextProvider,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
    IArchitectureModelDiffApplier diffApplier,
    IChangeImpactAnalyzer changeImpactAnalyzer,
    IIncrementalReReviewService incrementalReReviewService,
    ISpecialistReviewService specialistReviewService,
    IAuthorityFindingsSnapshotUpdater? findingsSnapshotUpdater,
    IArchitectureIntelligenceAuthorityFindingsContributor? authorityFindingsContributor = null) : IRecommendationImproveLoopCoordinator
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureModelDiffApplier _diffApplier =
        diffApplier ?? throw new ArgumentNullException(nameof(diffApplier));

    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer =
        changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));

    private readonly IIncrementalReReviewService _incrementalReReviewService =
        incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));

    private readonly ISpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IAuthorityFindingsSnapshotUpdater? _findingsSnapshotUpdater = findingsSnapshotUpdater;

    private readonly IArchitectureIntelligenceAuthorityFindingsContributor? _authorityFindingsContributor =
        authorityFindingsContributor;

    public async Task<RecommendationImproveLoopResult?> TryApplyAsync(
        RecommendationRecord recommendation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(recommendation);

        if (_knowledgeModelAccess is null || recommendation.RunId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid runId = recommendation.RunId;

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return null;

        ArchitectureRecommendation architectureRecommendation = new()
        {
            RecommendationId = recommendation.RecommendationId.ToString("D"),
            Problem = recommendation.Title,
            ProposedChange = recommendation.SuggestedAction ?? recommendation.Rationale ?? recommendation.Title,
            Confidence = recommendation.PriorityScore / 100.0,
        };

        ArchitectureModelDiff diff = _diffApplier.ApplyRecommendation(model, architectureRecommendation);
        await _knowledgeModelAccess.SaveForRunAsync(scope, runId, diff.AfterModel, cancellationToken)
            .ConfigureAwait(false);

        ChangeImpactResult impact = _changeImpactAnalyzer.Analyze(diff, architectureRecommendation);

        ReReviewScope scopeForReReview = new()
        {
            AffectedElementIds = impact.ImpactedItems
                .Select(item => item.ElementId)
                .Distinct(StringComparer.Ordinal)
                .ToList(),
            IncludeGlobalInvariantChecks = true,
            FullReReview = impact.RequiresFullReReview,
            Trigger = impact.RequiresFullReReview ? ReReviewTrigger.MajorTopologyChange : null,
        };

        IncrementalReReviewResult reReview = _incrementalReReviewService.ReReview(
            diff.AfterModel,
            scopeForReReview,
            _specialistReviewService);

        List<SpecialistReviewFinding> incrementalFindings = reReview.SpecialistResults
            .SelectMany(result => result.Findings)
            .ToList();

        if (_authorityFindingsContributor is not null && _findingsSnapshotUpdater is not null)
        {
            IReadOnlyList<Finding> authorityFindings = await _authorityFindingsContributor
                .ContributeAsync(scope, recommendation.RunId.ToString("D"), cancellationToken)
                .ConfigureAwait(false);

            List<SpecialistReviewFinding> mappedFindings = AuthorityFindingToSpecialistMapper.MapAll(authorityFindings);

            if (mappedFindings.Count > 0)
                incrementalFindings = mappedFindings;
        }

        if (incrementalFindings.Count > 0 && _findingsSnapshotUpdater is not null)
        {
            await _findingsSnapshotUpdater.MergeSpecialistFindingsAsync(
                scope,
                recommendation.RunId,
                incrementalFindings,
                cancellationToken).ConfigureAwait(false);
        }

        return new RecommendationImproveLoopResult
        {
            Diff = diff,
            Impact = impact,
            ReReview = reReview,
            PartialScopeDisclaimer = reReview.PartialScopeDisclaimer,
        };
    }
}
