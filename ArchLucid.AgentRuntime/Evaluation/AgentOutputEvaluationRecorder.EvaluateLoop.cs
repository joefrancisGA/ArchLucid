
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.QualityGates;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputEvaluationRecorder
{
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

        Dictionary<string, double?> calibratedByTaskId = AgentCalibratedConfidenceByTaskIdBuilder.Build(agentResults);

        IReadOnlyList<AgentExecutionTrace> tracesForEvaluation =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        await Task.WhenAll(tracesForEvaluation.Select(trace => EvaluateOneAsync(
            trace,
            calibratedByTaskId,
            runId,
            agentResults,
            evidence,
            cancellationToken))).ConfigureAwait(false);

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
    }

    private async Task EvaluateOneAsync(
        AgentExecutionTrace trace,
        Dictionary<string, double?> calibratedLookup,
        string runId,
        IReadOnlyList<AgentResult> agentResults,
        AgentEvidencePackage? evidence,
        CancellationToken cancellationToken)
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

        await AppendCalibrationSampleIfEnabledAsync(trace, matchingResult, evaluated, cancellationToken)
            .ConfigureAwait(false);

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
