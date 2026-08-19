using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class LlmBackedSpecialistReviewService : IAsyncSpecialistReviewService
{
    private static readonly IReadOnlyList<QualityDimension> DefaultDimensions =
    [
        QualityDimension.Reliability,
        QualityDimension.Security,
        QualityDimension.Cost,
    ];

    private readonly IArchitectureIntelligenceLlmGateway _gateway;
    private readonly SpecialistReviewService _heuristicService;

    public LlmBackedSpecialistReviewService(
        IArchitectureIntelligenceLlmGateway gateway,
        SpecialistReviewService heuristicService)
    {
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _heuristicService = heuristicService ?? throw new ArgumentNullException(nameof(heuristicService));
    }

    public async Task<SpecialistReviewResult> ReviewAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);

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
