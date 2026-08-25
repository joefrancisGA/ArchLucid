using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Unified specialist review adapter: sync path is heuristic-only; async path routes LLM vs heuristic.
/// </summary>
internal sealed class SpecialistReviewRouterService
    : ISpecialistReviewService, IAsyncSpecialistReviewService
{
    private static readonly IReadOnlyList<QualityDimension> DefaultDimensions =
    [
        QualityDimension.Reliability,
        QualityDimension.Security,
        QualityDimension.Cost,
    ];

    private readonly IArchitectureIntelligenceReviewRouter _router;
    private readonly IArchitectureIntelligenceLlmGateway _gateway;
    private readonly SpecialistReviewService _heuristicService;

    public SpecialistReviewRouterService(
        IArchitectureIntelligenceReviewRouter router,
        IArchitectureIntelligenceLlmGateway gateway,
        SpecialistReviewService heuristicService)
    {
        _router = router ?? throw new ArgumentNullException(nameof(router));
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _heuristicService = heuristicService ?? throw new ArgumentNullException(nameof(heuristicService));
    }

    public SpecialistReviewResult Review(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null) =>
        _heuristicService.Review(model, dimensions);

    public async Task<SpecialistReviewResult> ReviewAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);

        if (!_router.IsLlmReviewEnabled)
        {
            return _heuristicService.Review(model, dimensions);
        }

        IReadOnlyList<QualityDimension> reviewDimensions = dimensions ?? DefaultDimensions;
        List<SpecialistReviewFinding> findings = [];
        List<string> openQuestions = [];

        foreach (QualityDimension dimension in reviewDimensions)
        {
            SpecialistReviewResult? llmResult =
                await _gateway.ReviewDimensionAsync(model, dimension, cancellationToken);

            if (llmResult is not null && llmResult.Findings.Count > 0)
            {
                llmResult.Dimension = dimension;
                findings.AddRange(llmResult.Findings);
                openQuestions.AddRange(llmResult.OpenQuestions);
                continue;
            }

            SpecialistReviewResult heuristicResult = _heuristicService.Review(model, [dimension]);
            heuristicResult.Dimension = dimension;
            findings.AddRange(heuristicResult.Findings);
            openQuestions.AddRange(heuristicResult.OpenQuestions);
        }

        return new SpecialistReviewResult
        {
            Dimension = reviewDimensions.First(),
            Findings = findings,
            OpenQuestions = openQuestions.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
        };
    }
}
