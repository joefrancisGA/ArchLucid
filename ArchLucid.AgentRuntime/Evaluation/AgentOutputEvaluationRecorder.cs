using System.Diagnostics;
using System.Text.Json;

using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
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
    IScopeContextProvider scopeContextProvider,
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
    IAgentOutputFaithfulnessEvaluator llmFaithfulnessEvaluator,
    IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> llmFaithfulnessOptions,
    IAuditService auditService,
    IAgentOutputEvaluationRepository agentOutputEvaluationRepository,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
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

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentConfidenceCalibrationService _confidenceCalibrationService =
        confidenceCalibrationService ?? throw new ArgumentNullException(nameof(confidenceCalibrationService));

    private readonly IAgentConfidenceCalibrationSampleRepository _calibrationSampleRepository =
        calibrationSampleRepository ?? throw new ArgumentNullException(nameof(calibrationSampleRepository));

    private readonly AgentConfidenceCalibrationOptions _calibrationOptions =
        (calibrationOptions ?? throw new ArgumentNullException(nameof(calibrationOptions))).Value;

    private readonly IAgentResultEmbeddingFaithfulnessScorer _embeddingFaithfulnessScorer =
        embeddingFaithfulnessScorer ?? throw new ArgumentNullException(nameof(embeddingFaithfulnessScorer));

    private readonly IAgentOutputFaithfulnessEvaluator _llmFaithfulnessEvaluator =
        llmFaithfulnessEvaluator ?? throw new ArgumentNullException(nameof(llmFaithfulnessEvaluator));

    private readonly IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> _llmFaithfulnessOptions =
        llmFaithfulnessOptions ?? throw new ArgumentNullException(nameof(llmFaithfulnessOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAgentOutputEvaluationRepository _agentOutputEvaluationRepository =
        agentOutputEvaluationRepository ?? throw new ArgumentNullException(nameof(agentOutputEvaluationRepository));

    private readonly IOptionsMonitor<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    /// <summary>
    ///     Evaluates all traces with successful parses and records histogram/counter metrics.
    /// </summary>
    public async Task EvaluateAndRecordMetricsAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrEmpty(runId);

        ScopeContext scope = AmbientScopeContext.CurrentOverride ?? _scopeContextProvider.GetCurrentScope();

        AgentEvidencePackage? evidence =
            await agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AgentExecutionTrace> traces = await traceRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        await _confidenceCalibrationService
            .ApplyCalibratedConfidenceForRunAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<AgentResult> agentResults = await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        Dictionary<string, double?> calibratedByTaskId = BuildCalibratedConfidenceByTaskId(agentResults);

        IReadOnlyList<AgentExecutionTrace> tracesForEvaluation =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        await Task.WhenAll(tracesForEvaluation.Select(trace => EvaluateOneAsync(trace, calibratedByTaskId))).ConfigureAwait(false);

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
            AgentOutputLlmFaithfulnessOptions faithfulnessOptions = _llmFaithfulnessOptions.CurrentValue;
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
                    _llmFaithfulnessEvaluator,
                    calibratedLookup,
                    faithfulnessOptions).ConfigureAwait(false);

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
                {
                    double cosineUnit = EmbeddingFaithfulnessVectorMath.ToTelemetryUnitInterval(embCos);
                    ArchLucidInstrumentation.AgentOutputEmbeddingFaithfulnessMeanCosine.Record(cosineUnit, tags);
                    ArchLucidInstrumentation.AgentFaithfulnessCosine.Record(cosineUnit, tags);
                }

                if (evaluated.Semantic.LlmFaithfulnessScore is { } faithfulness)
                    ArchLucidInstrumentation.AgentOutputLlmFaithfulnessScore.Record(faithfulness, tags);

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
                QualityGateDefinitionSnapshot gateSnapshot =
                    QualityGateDefinitionSnapshotFactory.FromOptions(gateOptions);

                string rejectReason = qualityGate.ResolveRejectReasonCategory(
                    evaluated.GateOutcome,
                    evaluated.Structural,
                    evaluated.Semantic,
                    evaluated.EvaluationReason);

                QualityGateRecordedEvaluationSnapshot recordedEvaluation =
                    QualityGateRecordedEvaluationSnapshotFactory.Create(
                        evaluated.GateOutcome,
                        evaluated.Structural.StructuralCompletenessRatio,
                        evaluated.Semantic.OverallSemanticScore,
                        rejectReason);

                await traceRepository
                    .PatchQualityGateRecordedSnapshotAsync(
                        trace.TraceId,
                        evaluated.GateOutcome,
                        gateSnapshot.DefinitionVersion,
                        gateSnapshot.ContentHashSha256,
                        gateOptions.Mode.ToString(),
                        recordedEvaluation,
                        cancellationToken)
                    .ConfigureAwait(false);

                string gateModeLabel = !gateOptions.Enabled
                    ? "disabled"
                    : gateOptions.Mode == AgentOutputQualityGateMode.PilotStrict
                        ? "pilot_strict"
                        : "warn_only";

                string executionMode = AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel(
                    _agentExecutionOptions.CurrentValue.Mode);

                TagList gateTags = new()
                {
                    { "agent_type", agentLabel },
                    { "outcome", evaluated.GateOutcome.ToString().ToLowerInvariant() },
                    { "gate_mode", gateModeLabel },
                    { "reject_reason", rejectReason },
                    { "execution_mode", executionMode }
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

                    if (gateOptions.EnforceOnReject)
                        throw new AgentOutputQualityGateRejectedException(
                            runId,
                            trace.TraceId,
                            agentLabel,
                            evaluated.EvaluationReason,
                            recordedEvaluation.StructuralCompletenessRatio,
                            recordedEvaluation.SemanticScore,
                            recordedEvaluation.RejectReasonCategory,
                            recordedEvaluation.TriageScenarioId,
                            gateSnapshot.DefinitionVersion,
                            gateSnapshot.ContentHashSha256,
                            gateOptions.Mode.ToString());
                }

                else if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Warned)
                {
                    logger.LogWarningAgentOutputQualityGateWarned(
                        runId,
                        trace.TraceId,
                        agentLabel,
                        evaluated.Structural.StructuralCompletenessRatio,
                        evaluated.Semantic.OverallSemanticScore);
                }

                await TryLogLlmFaithfulnessGateAuditAsync(
                        runId,
                        trace,
                        evaluated,
                        faithfulnessOptions,
                        cancellationToken)
                    .ConfigureAwait(false);
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

    private async Task TryLogLlmFaithfulnessGateAuditAsync(
        string runId,
        AgentExecutionTrace trace,
        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult evaluated,
        AgentOutputLlmFaithfulnessOptions faithfulnessOptions,
        CancellationToken cancellationToken)
    {
        if (!faithfulnessOptions.Enabled || !faithfulnessOptions.EnforcePhaseB)
            return;

        if (evaluated.Semantic.LlmFaithfulnessScore is not { } score)
            return;

        string? eventType = null;

        if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Rejected
            && score < faithfulnessOptions.MinScoreRejectBelow)
            eventType = AuditEventTypes.AgentOutputLlmFaithfulnessRejected;
        else if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Warned
                 && faithfulnessOptions.MinScoreWarnBelow is { } warnCeiling
                 && score >= faithfulnessOptions.MinScoreRejectBelow
                 && score < warnCeiling)
            eventType = AuditEventTypes.AgentOutputLlmFaithfulnessWarned;

        if (eventType is null)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid runGuid) ? runGuid : null;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    traceId = trace.TraceId,
                    agentType = trace.AgentType.ToString(),
                    llmFaithfulnessScore = score,
                    minScoreRejectBelow = faithfulnessOptions.MinScoreRejectBelow,
                    minScoreWarnBelow = faithfulnessOptions.MinScoreWarnBelow,
                    gateOutcome = evaluated.GateOutcome.ToString(),
                    evaluationReason = evaluated.EvaluationReason,
                }),
            },
            cancellationToken).ConfigureAwait(false);
    }
}
