using System.Diagnostics;

using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Loads traces for a run, scores parsed JSON shape and semantic quality, and emits OTEL metrics (intended for
///     post-run or batch jobs).
/// </summary>
public sealed class AgentOutputEvaluationRecorder(
    IAgentExecutionTraceRepository traceRepository,
    IAgentOutputEvaluator evaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IOptions<AgentOutputQualityGateOptions> gateOptions,
    AgentOutputReferenceCaseRunEvaluator referenceCaseRunEvaluator,
    Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher architectureFindingConfidenceEnricher,
    ILogger<AgentOutputEvaluationRecorder> logger)
{
    private const double LowStructuralScoreThreshold = 0.5;

    /// <summary>
    ///     Log when semantic score is critically low (product/docs threshold; quality gate uses
    ///     <see cref="AgentOutputQualityGateOptions" />).
    /// </summary>
    private const double LowSemanticScoreThreshold = 0.3;

    private readonly AgentOutputQualityGateOptions _gateOptions =
        (gateOptions ?? throw new ArgumentNullException(nameof(gateOptions))).Value;

    private readonly AgentOutputReferenceCaseRunEvaluator _referenceCaseRunEvaluator =
        referenceCaseRunEvaluator ?? throw new ArgumentNullException(nameof(referenceCaseRunEvaluator));

    private readonly Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher _architectureFindingConfidenceEnricher =
        architectureFindingConfidenceEnricher ??
        throw new ArgumentNullException(nameof(architectureFindingConfidenceEnricher));

    /// <summary>
    ///     Evaluates all traces with successful parses and records histogram/counter metrics.
    /// </summary>
    public async Task EvaluateAndRecordMetricsAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrEmpty(runId);

        IReadOnlyList<AgentExecutionTrace> traces = await traceRepository.GetByRunIdAsync(runId, cancellationToken);

        foreach (AgentExecutionTrace trace in traces)
        {
            string agentLabel = trace.AgentType.ToString();
            TagList tags = new() { { "agent_type", agentLabel } };

            AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? evaluated =
                AgentOutputTraceQualityEvaluator.TryEvaluateTrace(
                    trace,
                    _gateOptions,
                    evaluator,
                    semanticEvaluator,
                    qualityGate);

            if (evaluated is null)
                continue;

            if (evaluated.IncrementParseFailureCounter)
                ArchLucidInstrumentation.AgentOutputParseFailuresTotal.Add(1, tags);

            if (evaluated.RecordStructuralHistogram)
            {
                ArchLucidInstrumentation.AgentOutputStructuralCompletenessRatio.Record(
                    evaluated.Structural.StructuralCompletenessRatio,
                    tags);

                if (evaluated.Structural.StructuralCompletenessRatio < LowStructuralScoreThreshold)

                    logger.LogWarningAgentOutputStructuralScoreBelowThreshold(
                        evaluated.Structural.StructuralCompletenessRatio,
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Structural.MissingKeys.Count);
            }

            if (evaluated.RecordSemanticHistogram)
            {
                ArchLucidInstrumentation.AgentOutputSemanticScore.Record(
                    evaluated.Semantic.OverallSemanticScore,
                    tags);

                if (evaluated.Semantic.OverallSemanticScore < LowSemanticScoreThreshold)

                    logger.LogWarningAgentOutputSemanticScoreBelowThreshold(
                        evaluated.Semantic.OverallSemanticScore,
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Semantic.EmptyClaimCount,
                        evaluated.Semantic.IncompleteFindingCount);
            }

            if (evaluated.EmitQualityGateMetric)
            {
                string gateModeLabel = !_gateOptions.Enabled
                    ? "disabled"
                    : _gateOptions.Mode == AgentOutputQualityGateMode.PilotStrict
                        ? "pilot_strict"
                        : "warn_only";

                TagList gateTags = new()
                {
                    { "agent_type", agentLabel },
                    { "outcome", evaluated.GateOutcome.ToString().ToLowerInvariant() },
                    { "gate_mode", gateModeLabel }
                };

                ArchLucidInstrumentation.AgentOutputQualityGateTotal.Add(1, gateTags);

                if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Rejected)
                {
                    logger.LogWarningAgentOutputQualityGateRejected(
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Structural.StructuralCompletenessRatio,
                        evaluated.Semantic.OverallSemanticScore);

                    if (_gateOptions.EnforceOnReject)
                        throw new AgentOutputQualityGateRejectedException(runId, trace.TraceId, agentLabel);
                }

                else if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Warned)
                {
                    logger.LogWarningAgentOutputQualityGateWarned(
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Structural.StructuralCompletenessRatio,
                        evaluated.Semantic.OverallSemanticScore);

                    await traceRepository.PatchQualityWarningAsync(trace.TraceId, true, cancellationToken);
                }
            }

            if (evaluated.RecordStructuralHistogram)

                await _referenceCaseRunEvaluator.EvaluateTraceAsync(trace, runId, cancellationToken);
        }

        try
        {
            await _architectureFindingConfidenceEnricher.TryEnrichRunAsync(runId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Architecture finding confidence enrichment failed after evaluation for RunId={RunId}; continuing.",
                runId);
        }
    }
}
