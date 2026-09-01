using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputEvaluationRecorder
{
    private async Task AppendCalibrationSampleIfEnabledAsync(
        AgentExecutionTrace trace,
        AgentResult? matchingResult,
        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult evaluated,
        CancellationToken cancellationToken)
    {
        if (matchingResult is not null && _calibrationOptions.Enabled)
        {
            await _calibrationSampleRepository
                .AppendAsync(
                    trace.AgentType,
                    matchingResult.Confidence,
                    evaluated.Semantic.OverallSemanticScore,
                    cancellationToken)
                .ConfigureAwait(false);
        }
    }
}
