using ArchLucid.Application.ArchitectureIntelligence.Stages;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class GoldenArchitectureTestRunner(
    IGoldenArchitectureInvokeStage invokeStage,
    IGoldenArchitectureBenchmarkStage benchmarkStage) : IGoldenArchitectureTestRunner
{
    private readonly IGoldenArchitectureInvokeStage _invokeStage =
        invokeStage ?? throw new ArgumentNullException(nameof(invokeStage));
    private readonly IGoldenArchitectureBenchmarkStage _benchmarkStage =
        benchmarkStage ?? throw new ArgumentNullException(nameof(benchmarkStage));

    public async Task<GoldenArchitectureTestResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        GoldenArchitectureInvokeStageResult invokeResult =
            await _invokeStage.InvokeAsync(request, cancellationToken);

        GoldenArchitectureBenchmarkAnalysis analysis = _benchmarkStage.Analyze(invokeResult);

        return new GoldenArchitectureTestResult
        {
            BeforeCounts = analysis.BeforeCounts,
            AfterCounts = analysis.AfterCounts,
            DeltaCounts = analysis.DeltaCounts,
            PlantedDefectRecall = analysis.PlantedDefectRecall,
            PlantedDefectsDetected = analysis.PlantedDefectsDetected,
            PlantedDefectsMissed = analysis.PlantedDefectsMissed,
            FalsePositiveCount = analysis.FalsePositiveCount,
            FalsePositivesByDimension = analysis.FalsePositivesByDimension,
            CategoryScores = analysis.CategoryScores,
            MutationChangedFindings = analysis.MutationChangedFindings,
            ReReviewTriggered = analysis.ReReviewTriggered,
            Passed = analysis.Passed,
            Notes =
                "Golden closed-loop: pre-apply vs post-apply auditable counts, planted-defect recall, "
                + "four-category scores, and mutation sensitivity.",
        };
    }
}
