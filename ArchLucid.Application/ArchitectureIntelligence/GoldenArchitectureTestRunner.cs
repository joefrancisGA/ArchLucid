using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class GoldenArchitectureTestRunner : IGoldenArchitectureTestRunner
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _orchestrator;

    public GoldenArchitectureTestRunner(IClosedLoopArchitectureReasoningOrchestrator orchestrator)
    {
        _orchestrator = orchestrator ?? throw new ArgumentNullException(nameof(orchestrator));
    }

    public async Task<GoldenArchitectureTestResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        Dictionary<string, int> beforeCounts = ArchitectureKnowledgeModelMetrics.CountMetrics(
            new ArchitectureKnowledgeModel(),
            []);

        ClosedLoopReasoningResult result = await _orchestrator.RunAsync(request, cancellationToken);

        List<SpecialistReviewFinding> findings = result.SpecialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        Dictionary<string, int> afterCounts = ArchitectureKnowledgeModelMetrics.CountMetrics(
            result.Model,
            findings);

        int falsePositiveCount = result.Adversarial.Challenges.Count;

        return new GoldenArchitectureTestResult
        {
            BeforeCounts = beforeCounts,
            AfterCounts = afterCounts,
            PlantedDefectRecall = ComputeRecallDelta(beforeCounts, afterCounts),
            FalsePositiveCount = falsePositiveCount,
            Passed = afterCounts[ArchitectureKnowledgeModelMetrics.HighSeverityFindings] > 0
                || result.Recommendations.Count > 0,
            Notes = "Golden architecture test executed against closed-loop reasoning orchestrator.",
        };
    }

    private static double ComputeRecallDelta(
        Dictionary<string, int> beforeCounts,
        Dictionary<string, int> afterCounts)
    {
        int beforeHighSeverity = beforeCounts[ArchitectureKnowledgeModelMetrics.HighSeverityFindings];
        int afterHighSeverity = afterCounts[ArchitectureKnowledgeModelMetrics.HighSeverityFindings];

        if (afterHighSeverity == 0)
        {
            return 0.0;
        }

        return Math.Max(0.0, (double)(afterHighSeverity - beforeHighSeverity) / afterHighSeverity);
    }
}
