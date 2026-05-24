using System.Diagnostics;

using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
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
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository agentResultRepository,
    IAgentOutputEvaluator evaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IAgentOutputQualityGateOptionsResolver gateOptionsResolver,
    IAgentConfidenceCalibrationService confidenceCalibrationService,
    IAgentConfidenceCalibrationSampleRepository calibrationSampleRepository,
    IOptions<AgentConfidenceCalibrationOptions> calibrationOptions,
    AgentOutputReferenceCaseRunEvaluator referenceCaseRunEvaluator,
    Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher architectureFindingConfidenceEnricher,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker,
    IAgentResultEmbeddingFaithfulnessScorer embeddingFaithfulnessScorer,
    IAgentOutputEvaluationRepository agentOutputEvaluationRepository,
    ILogger<AgentOutputEvaluationRecorder> logger)
{
    private const double LowStructuralScoreThreshold = 0.5;

    /// <summary>
    ///     Log when semantic score is critically low (product/docs threshold; quality gate uses
    ///     <see cref="AgentOutputQualityGateOptions" />).
    /// </summary>
    private const double LowSemanticScoreThreshold = 0.3;

    private readonly IAgentOutputQualityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly AgentOutputReferenceCaseRunEvaluator _referenceCaseRunEvaluator =
        referenceCaseRunEvaluator ?? throw new ArgumentNullException(nameof(referenceCaseRunEvaluator));

    private readonly Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher _architectureFindingConfidenceEnricher =
        architectureFindingConfidenceEnricher ??
        throw new ArgumentNullException(nameof(architectureFindingConfidenceEnricher));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAgentConfidenceCalibrationService _confidenceCalibrationService =
        confidenceCalibrationService ?? throw new ArgumentNullException(nameof(confidenceCalibrationService));

    private readonly IAgentConfidenceCalibrationSampleRepository _calibrationSampleRepository =
        calibrationSampleRepository ?? throw new ArgumentNullException(nameof(calibrationSampleRepository));

    private readonly AgentConfidenceCalibrationOptions _calibrationOptions =
        (calibrationOptions ?? throw new ArgumentNullException(nameof(calibrationOptions))).Value;

    private readonly IAgentResultEmbeddingFaithfulnessScorer _embeddingFaithfulnessScorer =
        embeddingFaithfulnessScorer ?? throw new ArgumentNullException(nameof(embeddingFaithfulnessScorer));

    private readonly IAgentOutputEvaluationRepository _agentOutputEvaluationRepository =
        agentOutputEvaluationRepository ?? throw new ArgumentNullException(nameof(agentOutputEvaluationRepository));

    /// <summary>
    ///     Evaluates all traces with successful parses and records histogram/counter metrics.
    /// </summary>
    public async Task EvaluateAndRecordMetricsAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrEmpty(runId);

        AgentEvidencePackage? evidence =
            await agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AgentExecutionTrace> traces = await traceRepository.GetByRunIdAsync(runId, cancellationToken);

        await _confidenceCalibrationService
            .ApplyCalibratedConfidenceForRunAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<AgentResult> agentResults = await _agentResultRepository.GetByRunIdAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        Dictionary<string, double?> calibratedByTaskId = BuildCalibratedConfidenceByTaskId(agentResults);

        await Task.WhenAll(traces.Select(trace => EvaluateOneAsync(trace, calibratedByTaskId))).ConfigureAwait(false);

        try
        {
            await _architectureFindingConfidenceEnricher.TryEnrichRunAsync(runId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "Architecture finding confidence enrichment failed after evaluation for RunId={RunId}; continuing.",
                runId);
        }

        return;

        async Task EvaluateOneAsync(AgentExecutionTrace trace, Dictionary<string, double?> calibratedLookup)
        {
            AgentOutputQualityGateOptions gateOptions = _gateOptionsResolver.Resolve(cancellationToken);
            string agentLabel = trace.AgentType.ToString();
            TagList tags = new() { { "agent_type", agentLabel } };

            AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? evaluated =
                await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                    trace,
                    gateOptions,
                    evaluator,
                    semanticEvaluator,
                    qualityGate,
                    cancellationToken,
                    evidence,
                    agentResultEvidenceFaithfulnessChecker,
                    _embeddingFaithfulnessScorer,
                    calibratedLookup).ConfigureAwait(false);

            if (evaluated is null)
                return;

            AgentResult? matchingResult = agentResults.FirstOrDefault(r => r.TaskId == trace.TaskId);

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

            if (matchingResult is not null
                && !string.IsNullOrWhiteSpace(matchingResult.PromptVariantKey))
            {
                string templateName = PromptTemplateNameResolver.FromAgentType(trace.AgentType);
                bool qualityGatePassed = evaluated.GateOutcome != AgentOutputQualityGateOutcome.Rejected;

                await _agentOutputEvaluationRepository
                    .AppendAsync(
                        new AgentOutputEvaluationInsert
                        {
                            ResultId = matchingResult.ResultId,
                            RunId = runId,
                            PromptTemplateName = templateName,
                            PromptVariantKey = matchingResult.PromptVariantKey,
                            AgentType = trace.AgentType,
                            SemanticScore = evaluated.Semantic.OverallSemanticScore,
                            QualityGatePassed = qualityGatePassed,
                            CreatedUtc = TimeProvider.System.UtcNowDateTime()
                        },
                        cancellationToken)
                    .ConfigureAwait(false);
            }

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
                ArchLucidInstrumentation.AgentOutputSemanticScore.Record(evaluated.Semantic.OverallSemanticScore, tags);

                if (evaluated.Semantic.LlmJudgeHeuristicDisagreement is { } disagreement)
                    ArchLucidInstrumentation.AgentOutputJudgeDisagreement.Record(disagreement, tags);

                if (evaluated.Semantic.AgentResultEmbeddingFaithfulnessMeanCosine is { } embCos)
                    ArchLucidInstrumentation.AgentOutputEmbeddingFaithfulnessMeanCosine.Record(
                        EmbeddingFaithfulnessVectorMath.ToTelemetryUnitInterval(embCos),
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
                string gateModeLabel = !gateOptions.Enabled
                    ? "disabled"
                    : gateOptions.Mode == AgentOutputQualityGateMode.PilotStrict
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

                    await traceRepository.PatchQualityRejectedAsync(trace.TraceId, true, cancellationToken)
                        .ConfigureAwait(false);

                    if (gateOptions.EnforceOnReject)
                        throw new AgentOutputQualityGateRejectedException(
                            runId,
                            trace.TraceId,
                            agentLabel,
                            evaluated.EvaluationReason);
                }

                else if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Warned)
                {
                    logger.LogWarningAgentOutputQualityGateWarned(
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Structural.StructuralCompletenessRatio,
                        evaluated.Semantic.OverallSemanticScore);

                    await traceRepository.PatchQualityWarningAsync(trace.TraceId, true, cancellationToken)
                        .ConfigureAwait(false);
                }
            }

            if (evaluated.RecordStructuralHistogram)

                await _referenceCaseRunEvaluator.EvaluateTraceAsync(trace, runId, cancellationToken)
                    .ConfigureAwait(false);
        }
    }

    private static Dictionary<string, double?> BuildCalibratedConfidenceByTaskId(IReadOnlyList<AgentResult> agentResults)
    {
        Dictionary<string, double?> map = new(StringComparer.Ordinal);

        foreach (AgentResult result in agentResults)
        {
            if (result.CalibratedConfidence is { } calibrated)
                map[result.TaskId] = calibrated;
        }

        return map;
    }
}
