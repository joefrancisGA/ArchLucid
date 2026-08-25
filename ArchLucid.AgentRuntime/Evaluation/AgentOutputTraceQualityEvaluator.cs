using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Shared structural/citation/PilotStrict rules for <see cref="AgentOutputEvaluationRecorder" /> and pilot sponsor gates.
/// </summary>
public static class AgentOutputTraceQualityEvaluator
{
    /// <summary>
    ///     Result of evaluating one trace; <see langword="null" /> means skip this trace entirely (legacy warn-only skips).
    /// </summary>
    public sealed record TraceQualityEvaluationResult(
        bool RecordStructuralHistogram,
        bool RecordSemanticHistogram,
        bool IncrementParseFailureCounter,
        bool EmitQualityGateMetric,
        AgentOutputEvaluationScore Structural,
        AgentOutputSemanticScore Semantic,
        AgentOutputQualityGateOutcome GateOutcome,
        string? EvaluationReason = null);

    /// <summary>
    ///     Computes histogram + gate outcome consistent with quality gate options.
    /// </summary>
    /// <returns><see langword="null" /> when no metrics should be emitted for this trace.</returns>
    public static Task<TraceQualityEvaluationResult?> TryEvaluateTraceAsync(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken,
        AgentEvidencePackage? evidencePackage = null,
        IAgentResultEvidenceFaithfulnessChecker? agentResultFaithfulnessChecker = null,
        IAgentResultEmbeddingFaithfulnessScorer? embeddingFaithfulnessScorer = null,
        IAgentOutputFaithfulnessEvaluator? llmFaithfulnessEvaluator = null,
        IReadOnlyDictionary<string, double?>? calibratedConfidenceByTaskId = null,
        AgentOutputLlmFaithfulnessOptions? llmFaithfulnessOptions = null) =>
        TryEvaluateTraceAsyncCore(
            trace,
            options,
            structuralEvaluator,
            semanticEvaluator,
            qualityGate,
            cancellationToken,
            evidencePackage,
            agentResultFaithfulnessChecker,
            embeddingFaithfulnessScorer,
            llmFaithfulnessEvaluator,
            calibratedConfidenceByTaskId,
            llmFaithfulnessOptions ?? new AgentOutputLlmFaithfulnessOptions());

    private static async Task<TraceQualityEvaluationResult?> TryEvaluateTraceAsyncCore(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken,
        AgentEvidencePackage? evidencePackage,
        IAgentResultEvidenceFaithfulnessChecker? agentResultFaithfulnessChecker,
        IAgentResultEmbeddingFaithfulnessScorer? embeddingFaithfulnessScorer,
        IAgentOutputFaithfulnessEvaluator? llmFaithfulnessEvaluator,
        IReadOnlyDictionary<string, double?>? calibratedConfidenceByTaskId,
        AgentOutputLlmFaithfulnessOptions llmFaithfulnessOptions)
    {
        ArgumentNullException.ThrowIfNull(trace);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(structuralEvaluator);
        ArgumentNullException.ThrowIfNull(semanticEvaluator);
        ArgumentNullException.ThrowIfNull(qualityGate);

        bool pilotStrict = options.Mode == AgentOutputQualityGateMode.PilotStrict;

        if (!options.Enabled)
            return await TryEvaluateTraceGateDisabledAsync(
                trace,
                structuralEvaluator,
                semanticEvaluator,
                qualityGate,
                cancellationToken).ConfigureAwait(false);

        if (!trace.ParseSucceeded || string.IsNullOrEmpty(trace.ParsedResultJson))
            return pilotStrict
                ? await AgentOutputTracePilotStrictBuilders.BuildPilotStrictUnparsedResultAsync(trace, structuralEvaluator, semanticEvaluator, cancellationToken)
                    .ConfigureAwait(false)
                : null;

        AgentOutputEvaluationScore structuralScore =
            structuralEvaluator.Evaluate(trace.TraceId, trace.ParsedResultJson, trace.AgentType);

        if (structuralScore.IsJsonParseFailure)
            return pilotStrict
                ? await AgentOutputTracePilotStrictBuilders.BuildPilotStrictEvaluatorParseFailureResultAsync(
                        trace,
                        structuralEvaluator,
                        semanticEvaluator,
                        cancellationToken)
                    .ConfigureAwait(false)
                : new TraceQualityEvaluationResult(
                    false,
                    false,
                    true,
                    false,
                    structuralScore,
                    await semanticEvaluator.EvaluateAsync(
                            trace.TraceId,
                            trace.ParsedResultJson,
                            trace.AgentType,
                            cancellationToken)
                        .ConfigureAwait(false),
                    AgentOutputQualityGateOutcome.Accepted,
                    null);

        AgentOutputSemanticScore semanticScore =
            await semanticEvaluator.EvaluateAsync(trace.TraceId, trace.ParsedResultJson, trace.AgentType, cancellationToken)
                .ConfigureAwait(false);

        double? calibratedConfidence = null;

        if (calibratedConfidenceByTaskId is not null)
            calibratedConfidenceByTaskId.TryGetValue(trace.TaskId, out calibratedConfidence);

        AgentOutputQualityGateOutcome gateOutcome =
            qualityGate.Evaluate(structuralScore, semanticScore, calibratedConfidence);

        AgentOutputTracePilotStrictBuilders.ApplyPilotStrictScoreFloors(options, pilotStrict, structuralScore, semanticScore, ref gateOutcome);

        bool hasCitations = TryHasNonEmptyCitations(trace.ParsedResultJson);

        AgentOutputTraceCitationGate.ApplyCitationOutcome(pilotStrict, hasCitations, ref gateOutcome);

        if (pilotStrict && options.PilotStrictMinEvidenceRefCount > 0 &&
            !AgentOutputTraceCitationGate.MeetsEvidenceRefFloor(trace.ParsedResultJson, options.PilotStrictMinEvidenceRefCount))
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

        AgentOutputTraceFaithfulnessEvaluator.ApplyAgentResultEvidenceFaithfulness(
            options,
            pilotStrict,
            trace.ParsedResultJson,
            evidencePackage,
            agentResultFaithfulnessChecker,
            semanticScore,
            ref gateOutcome);

        await AgentOutputTraceFaithfulnessEvaluator.ApplyAgentResultEmbeddingFaithfulnessAsync(
            trace.ParsedResultJson,
            evidencePackage,
            semanticScore,
            embeddingFaithfulnessScorer,
            cancellationToken).ConfigureAwait(false);

        double? llmFaithfulnessScore =
            await AgentOutputTraceFaithfulnessEvaluator.EvaluateLlmFaithfulnessScoreAsync(
                trace,
                evidencePackage,
                semanticScore,
                llmFaithfulnessEvaluator,
                cancellationToken).ConfigureAwait(false);

        ApplyLlmFaithfulnessPhaseBEnforcement(llmFaithfulnessScore, llmFaithfulnessOptions, ref gateOutcome);

        ApplyJudgeHeuristicDisagreementElevation(semanticScore, ref gateOutcome);

        string? evaluationReason = gateOutcome == AgentOutputQualityGateOutcome.Rejected
            ? AgentOutputTraceRejectionSummaryBuilder.BuildPublicRejectionSummary(
                qualityGate,
                options,
                llmFaithfulnessOptions,
                pilotStrict,
                trace.ParsedResultJson,
                structuralScore,
                semanticScore,
                gateOutcome)
            : gateOutcome == AgentOutputQualityGateOutcome.Warned
                && llmFaithfulnessOptions.Enabled
                && llmFaithfulnessOptions.EnforcePhaseB
                && semanticScore.LlmFaithfulnessScore is { } warnScore
                && llmFaithfulnessOptions.MinScoreWarnBelow is { } warnCeiling
                && warnScore >= llmFaithfulnessOptions.MinScoreRejectBelow
                && warnScore < warnCeiling
                ? "llm_faithfulness_below_warn_floor"
            : null;

        return new TraceQualityEvaluationResult(true, true, false, true, structuralScore, semanticScore, gateOutcome, evaluationReason);
    }

    /// <summary>
    ///     Phase B LLM-faithfulness reject/warn floors. Forwards to
    ///     <see cref="AgentOutputTraceFaithfulnessEvaluator" /> so InternalsVisibleTo callers keep this type's surface.
    /// </summary>
    internal static void ApplyLlmFaithfulnessPhaseBEnforcement(
        double? llmFaithfulnessScore,
        AgentOutputLlmFaithfulnessOptions faithfulnessOptions,
        ref AgentOutputQualityGateOutcome gateOutcome) =>
        AgentOutputTraceFaithfulnessEvaluator.ApplyLlmFaithfulnessPhaseBEnforcement(
            llmFaithfulnessScore,
            faithfulnessOptions,
            ref gateOutcome);

    private static async Task<TraceQualityEvaluationResult?> TryEvaluateTraceGateDisabledAsync(
        AgentExecutionTrace trace,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken)
    {
        if (!trace.ParseSucceeded || string.IsNullOrEmpty(trace.ParsedResultJson))
            return null;

        AgentOutputEvaluationScore structuralScore =
            structuralEvaluator.Evaluate(trace.TraceId, trace.ParsedResultJson, trace.AgentType);

        if (structuralScore.IsJsonParseFailure)
            return new TraceQualityEvaluationResult(
                false,
                false,
                true,
                false,
                structuralScore,
                await semanticEvaluator.EvaluateAsync(
                        trace.TraceId,
                        trace.ParsedResultJson,
                        trace.AgentType,
                        cancellationToken)
                    .ConfigureAwait(false),
                AgentOutputQualityGateOutcome.Accepted,
                null);

        AgentOutputSemanticScore semanticScore =
            await semanticEvaluator.EvaluateAsync(trace.TraceId, trace.ParsedResultJson, trace.AgentType, cancellationToken)
                .ConfigureAwait(false);

        AgentOutputQualityGateOutcome outcome = qualityGate.Evaluate(structuralScore, semanticScore);

        ApplyJudgeHeuristicDisagreementElevation(semanticScore, ref outcome);

        return new TraceQualityEvaluationResult(true, true, false, true, structuralScore, semanticScore, outcome, null);
    }

    private static void ApplyJudgeHeuristicDisagreementElevation(
        AgentOutputSemanticScore semanticScore,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (gateOutcome != AgentOutputQualityGateOutcome.Accepted)
            return;

        if (!semanticScore.JudgeHeuristicDisagreementElevatesWarn)
            return;

        gateOutcome = AgentOutputQualityGateOutcome.Warned;
    }

    /// <summary>
    ///     True when parsed output has a non-empty top-level <c>citations</c> array.
    ///     Forwards to <see cref="AgentOutputTraceCitationGate" /> so InternalsVisibleTo callers keep this type's surface.
    /// </summary>
    internal static bool TryHasNonEmptyCitations(string parsedResultJson) =>
        AgentOutputTraceCitationGate.TryHasNonEmptyCitations(parsedResultJson);

    /// <summary>
    ///     Confidence enrichment signal — mirrors trace gate semantics without histogram emission.
    /// </summary>
    public static Task<bool> ComputeQualityGateAcceptedForConfidenceAsync(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken,
        AgentEvidencePackage? evidencePackage = null,
        IAgentResultEvidenceFaithfulnessChecker? agentResultFaithfulnessChecker = null) =>
        ComputeQualityGateAcceptedForConfidenceAsyncCore(
            trace,
            options,
            structuralEvaluator,
            semanticEvaluator,
            qualityGate,
            cancellationToken,
            evidencePackage,
            agentResultFaithfulnessChecker);

    private static async Task<bool> ComputeQualityGateAcceptedForConfidenceAsyncCore(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken,
        AgentEvidencePackage? evidencePackage,
        IAgentResultEvidenceFaithfulnessChecker? agentResultFaithfulnessChecker)
    {
        TraceQualityEvaluationResult? result =
            await TryEvaluateTraceAsync(
                trace,
                options,
                structuralEvaluator,
                semanticEvaluator,
                qualityGate,
                cancellationToken,
                evidencePackage,
                agentResultFaithfulnessChecker).ConfigureAwait(false);

        return result is { GateOutcome: not AgentOutputQualityGateOutcome.Rejected };
    }
}
