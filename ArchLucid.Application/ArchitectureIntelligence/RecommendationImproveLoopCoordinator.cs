using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

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

    public bool PublishBlocked
    {
        get;
        init;
    }

    public IReadOnlyList<string> PublishBlockReasons
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
    ISpecialistFindingsSubstantiationService specialistFindingsSubstantiationService,
    IMustNotFailEnforcer mustNotFailEnforcer,
    ITrustPublishGate trustPublishGate,
    IAuthorityFindingsSnapshotUpdater? findingsSnapshotUpdater,
    IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate,
    ITechnologyLedgerRepository? technologyLedgerRepository = null,
    IReviewResultCache? reviewResultCache = null) : IRecommendationImproveLoopCoordinator
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

    private readonly ISpecialistFindingsSubstantiationService _specialistFindingsSubstantiationService =
        specialistFindingsSubstantiationService
        ?? throw new ArgumentNullException(nameof(specialistFindingsSubstantiationService));

    private readonly IMustNotFailEnforcer _mustNotFailEnforcer =
        mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));

    private readonly ITrustPublishGate _trustPublishGate =
        trustPublishGate ?? throw new ArgumentNullException(nameof(trustPublishGate));

    private readonly IAuthorityFindingsSnapshotUpdater? _findingsSnapshotUpdater = findingsSnapshotUpdater;

    private readonly IReRunExecuteSealedManifestPinGate _reRunExecuteSealedManifestPinGate =
        reRunExecuteSealedManifestPinGate ?? throw new ArgumentNullException(nameof(reRunExecuteSealedManifestPinGate));

    private readonly ITechnologyLedgerRepository? _technologyLedgerRepository = technologyLedgerRepository;

    private readonly IReviewResultCache? _reviewResultCache = reviewResultCache;

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

        await _reRunExecuteSealedManifestPinGate.EnsureReadyAsync(runId.ToString("N"), cancellationToken)
            .ConfigureAwait(false);

        ArchitectureRecommendation architectureRecommendation = new()
        {
            RecommendationId = recommendation.RecommendationId.ToString("D"),
            Problem = recommendation.Title,
            Evidence = recommendation.Rationale ?? recommendation.Title,
            AffectedRequirementOrQualityAttribute = recommendation.Title,
            ConsequenceOfInaction = recommendation.Rationale ?? recommendation.Title,
            ProposedChange = recommendation.SuggestedAction ?? recommendation.Rationale ?? recommendation.Title,
            ValidationMethod = "Improve-loop review.",
            Confidence = recommendation.PriorityScore / 100.0,
        };

        ArchitectureModelDiff diff = _diffApplier.ApplyRecommendation(model, architectureRecommendation);
        ArchitectureKnowledgeModel afterModel = diff.AfterModel
            ?? throw new InvalidOperationException("Recommendation apply did not produce an after-model.");

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

        SpecialistFindingsSubstantiationResult substantiation = incrementalFindings.Count == 0
            ? new SpecialistFindingsSubstantiationResult()
            : await _specialistFindingsSubstantiationService
                .SubstantiateAsync(incrementalFindings, cancellationToken)
                .ConfigureAwait(false);

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(
                substantiation.SubstantiatedFindings,
                [architectureRecommendation],
                await TryLoadLedgerEntriesAsync(scope, runId, cancellationToken))
            .ToList();

        TrustPublishDecision publishDecision = _trustPublishGate.Decide(
            substantiation.SubstantiatedFindings,
            [architectureRecommendation],
            substantiation.ValidationResults.ToList(),
            mustNotFailViolations);

        if (publishDecision.PublishBlocked)
        {
            return new RecommendationImproveLoopResult
            {
                PublishBlocked = true,
                PublishBlockReasons = publishDecision.BlockReasons.ToList(),
            };
        }

        await _knowledgeModelAccess.SaveForRunAsync(scope, runId, afterModel, cancellationToken)
            .ConfigureAwait(false);

        if (_reviewResultCache is not null)
            _reviewResultCache.InvalidateForRun(runId.ToString("N"));

        IReadOnlyList<string> mergedFindingIds = [];

        if (substantiation.SubstantiatedFindings.Count > 0 && _findingsSnapshotUpdater is not null)
        {
            mergedFindingIds = await _findingsSnapshotUpdater.MergeSubstantiatedFindingsAsync(
                scope,
                recommendation.RunId,
                substantiation,
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

    private async Task<IReadOnlyList<TechnologyLedgerEntry>?> TryLoadLedgerEntriesAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (_technologyLedgerRepository is null)
            return null;

        try
        {
            return await _technologyLedgerRepository
                .GetByRunIdAsync(scope, runId.ToString("D"), cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }
    }
}
