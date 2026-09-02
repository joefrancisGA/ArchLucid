using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class ClosedLoopRecommendationStage(
    IAsyncArchitectureRecommendationEngine recommendationEngine,
    IChangeImpactAnalyzer changeImpactAnalyzer,
    IArchitectureModelDiffApplier modelDiffApplier,
    IIncrementalReReviewService incrementalReReviewService,
    IAsyncSpecialistReviewService specialistReviewService,
    ClosedLoopArchitectureReasoningPostStageHooks postStageHooks) : IClosedLoopRecommendationStage
{
    private readonly IAsyncArchitectureRecommendationEngine _recommendationEngine =
        recommendationEngine ?? throw new ArgumentNullException(nameof(recommendationEngine));

    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer =
        changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));

    private readonly IArchitectureModelDiffApplier _modelDiffApplier =
        modelDiffApplier ?? throw new ArgumentNullException(nameof(modelDiffApplier));

    private readonly IIncrementalReReviewService _incrementalReReviewService =
        incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly ClosedLoopArchitectureReasoningPostStageHooks _postStageHooks =
        postStageHooks ?? throw new ArgumentNullException(nameof(postStageHooks));

    public async Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        ProgressiveInterviewState interview = context.Interview;

        IReadOnlyList<SpecialistReviewFinding> recommendationSourceFindings =
            context.Adversarial.SubstantiatedFindings.Count > 0
                ? context.Adversarial.SubstantiatedFindings
                : context.AllFindings;

        context.AllFindingsCountBeforeIntegrate = context.AllFindings.Count;
        context.ValidationFindingIdsBeforeIntegrate = context.ValidationResults
            .Select(result => result.FindingId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        if (!interview.IsFramingComplete)
            return;

        context.Recommendations = (await _recommendationEngine
            .BuildRecommendationsAsync(
                context.Model,
                recommendationSourceFindings,
                context.EffectiveRequest.DeclaredPriorities,
                cancellationToken))
            .ToList();

        if (context.Recommendations.Count == 0)
            return;

        context.ModelBeforeRecommendationApply = ArchitectureKnowledgeModelCloner.Clone(context.Model);

        ClosedLoopRecommendationBatchApplyResult applied =
            new ClosedLoopRecommendationBatchApplier(_modelDiffApplier, _changeImpactAnalyzer)
                .Apply(context.Model, context.Recommendations);

        context.ModelDiffs = applied.ModelDiffs;
        context.ImpactResults = applied.ImpactResults;
        context.Model = applied.WorkingModel;

        context.ReReview = await _incrementalReReviewService.ReReviewAsync(
            context.Model,
            applied.Scope,
            _specialistReviewService,
            cancellationToken).ConfigureAwait(false);

        context.ReReviewSubstantiation = await _postStageHooks.IntegrateReReviewFindingsAsync(
            context.RunId,
            context.ReReview,
            context.AllFindings,
            context.ValidationResults,
            context.ValidationByFindingId,
            cancellationToken).ConfigureAwait(false);

        if (context.ReReviewSubstantiation is not null)
            context.ReReviewIntegrated = true;
    }
}
