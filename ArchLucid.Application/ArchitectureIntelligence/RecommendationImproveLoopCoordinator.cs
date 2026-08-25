using ArchLucid.Contracts.Advisory.Workflow;
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

    public IReadOnlyList<string> MergedFindingIds
    {
        get;
        init;
    } = [];
}

public sealed class RecommendationImproveLoopCoordinator(
    IScopeContextProvider scopeContextProvider,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
    IArchitectureModelDiffApplier diffApplier,
    IChangeImpactAnalyzer changeImpactAnalyzer,
    IIncrementalReReviewService incrementalReReviewService,
    IAsyncSpecialistReviewService specialistReviewService,
    IAuthorityFindingsSnapshotUpdater? findingsSnapshotUpdater) : IRecommendationImproveLoopCoordinator
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

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IAuthorityFindingsSnapshotUpdater? _findingsSnapshotUpdater = findingsSnapshotUpdater;

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
        ArchitectureKnowledgeModel afterModel = diff.AfterModel
            ?? throw new InvalidOperationException("Recommendation apply did not produce an after-model.");

        await _knowledgeModelAccess.SaveForRunAsync(scope, runId, afterModel, cancellationToken)
            .ConfigureAwait(false);

        ChangeImpactResult impact = _changeImpactAnalyzer.Analyze(diff, architectureRecommendation);

        ReReviewScope scopeForReReview = new()
        {
            AffectedElementIds = (impact.ImpactedItems ?? [])
                .Select(item => item.ElementId)
                .Where(static id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .ToList(),
            IncludeGlobalInvariantChecks = true,
            FullReReview = impact.RequiresFullReReview,
            Trigger = impact.RequiresFullReReview ? ReReviewTrigger.MajorTopologyChange : null,
        };

        IncrementalReReviewResult reReview = await _incrementalReReviewService.ReReviewAsync(
            afterModel,
            scopeForReReview,
            _specialistReviewService,
            cancellationToken).ConfigureAwait(false);

        List<SpecialistReviewFinding> incrementalFindings = reReview.SpecialistResults
            .SelectMany(result => result.Findings)
            .ToList();

        IReadOnlyList<string> mergedFindingIds = [];

        if (incrementalFindings.Count > 0 && _findingsSnapshotUpdater is not null)
        {
            mergedFindingIds = await _findingsSnapshotUpdater.MergeSpecialistFindingsAsync(
                scope,
                recommendation.RunId,
                incrementalFindings,
                cancellationToken).ConfigureAwait(false);
        }

        return new RecommendationImproveLoopResult
        {
            Diff = ArchitectureModelDiffPayloadSlimmer.WithoutModels(diff),
            Impact = impact,
            ReReview = reReview,
            PartialScopeDisclaimer = reReview.PartialScopeDisclaimer,
            MergedFindingIds = mergedFindingIds,
        };
    }
}
