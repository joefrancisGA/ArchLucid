using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class GoldenArchitectureInvokeStage(
    IClosedLoopArchitectureReasoningOrchestrator orchestrator) : IGoldenArchitectureInvokeStage
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _orchestrator =
        orchestrator ?? throw new ArgumentNullException(nameof(orchestrator));

    public async Task<GoldenArchitectureInvokeStageResult> InvokeAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ClosedLoopReasoningResult result = await _orchestrator.RunAsync(request, cancellationToken);

        List<SpecialistReviewFinding> findings = result.SpecialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        ArchitectureKnowledgeModel beforeModel = result.ModelDiffs.Count > 0
            ? result.ModelDiffs[0].BeforeModel
            : result.Model;

        ArchitectureKnowledgeModel afterModel = result.Model;

        List<SpecialistReviewFinding> afterFindings = result.ReReview?.SpecialistResults
            .SelectMany(review => review.Findings)
            .ToList() ?? findings;

        return new GoldenArchitectureInvokeStageResult
        {
            ClosedLoopResult = result,
            Findings = findings,
            BeforeModel = beforeModel,
            AfterModel = afterModel,
            AfterFindings = afterFindings,
        };
    }
}
