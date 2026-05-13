using System.Collections.Generic;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
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
        IAgentResultEmbeddingFaithfulnessScorer? embeddingFaithfulnessScorer = null) =>
        TryEvaluateTraceAsyncCore(
            trace,
            options,
            structuralEvaluator,
            semanticEvaluator,
            qualityGate,
            cancellationToken,
            evidencePackage,
            agentResultFaithfulnessChecker,
            embeddingFaithfulnessScorer);

    private static async Task<TraceQualityEvaluationResult?> TryEvaluateTraceAsyncCore(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken,
        AgentEvidencePackage? evidencePackage,
        IAgentResultEvidenceFaithfulnessChecker? agentResultFaithfulnessChecker,
        IAgentResultEmbeddingFaithfulnessScorer? embeddingFaithfulnessScorer)
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
                ? await BuildPilotStrictUnparsedResultAsync(trace, structuralEvaluator, semanticEvaluator, cancellationToken)
                    .ConfigureAwait(false)
                : null;

        AgentOutputEvaluationScore structuralScore =
            structuralEvaluator.Evaluate(trace.TraceId, trace.ParsedResultJson, trace.AgentType);

        if (structuralScore.IsJsonParseFailure)
            return pilotStrict
                ? await BuildPilotStrictEvaluatorParseFailureResultAsync(
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

        AgentOutputQualityGateOutcome gateOutcome = qualityGate.Evaluate(structuralScore, semanticScore);

        ApplyPilotStrictScoreFloors(options, pilotStrict, structuralScore, semanticScore, ref gateOutcome);

        bool hasCitations = TryHasNonEmptyCitations(trace.ParsedResultJson);

        ApplyCitationOutcome(pilotStrict, hasCitations, ref gateOutcome);

        if (pilotStrict && options.PilotStrictMinEvidenceRefCount > 0 &&
            !MeetsEvidenceRefFloor(trace.ParsedResultJson, options.PilotStrictMinEvidenceRefCount))
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

        ApplyAgentResultEvidenceFaithfulness(
            options,
            pilotStrict,
            trace.ParsedResultJson,
            evidencePackage,
            agentResultFaithfulnessChecker,
            semanticScore,
            ref gateOutcome);

        await ApplyAgentResultEmbeddingFaithfulnessAsync(
            trace.ParsedResultJson,
            evidencePackage,
            semanticScore,
            embeddingFaithfulnessScorer,
            cancellationToken).ConfigureAwait(false);

        ApplyJudgeHeuristicDisagreementElevation(semanticScore, ref gateOutcome);

        string? evaluationReason = gateOutcome == AgentOutputQualityGateOutcome.Rejected
            ? BuildPublicRejectionSummary(
                qualityGate,
                options,
                pilotStrict,
                trace.ParsedResultJson,
                structuralScore,
                semanticScore,
                gateOutcome)
            : null;

        return new TraceQualityEvaluationResult(true, true, false, true, structuralScore, semanticScore, gateOutcome, evaluationReason);
    }

    private static void ApplyAgentResultEvidenceFaithfulness(
        AgentOutputQualityGateOptions options,
        bool pilotStrict,
        string parsedResultJson,
        AgentEvidencePackage? evidencePackage,
        IAgentResultEvidenceFaithfulnessChecker? checker,
        AgentOutputSemanticScore semanticScore,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (checker is null || evidencePackage is null)
            return;

        AgentResultEvidenceFaithfulnessReport report = checker.Evaluate(parsedResultJson, evidencePackage);

        semanticScore.AgentResultFaithfulnessSupportRatio = report.SupportRatio;

        if (!pilotStrict || options.PilotStrictMinAgentResultFaithfulnessSupportRatio is not { } floor)
            return;

        if (report.SupportRatio < floor)
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;
    }

    private static async Task ApplyAgentResultEmbeddingFaithfulnessAsync(
        string? parsedResultJson,
        AgentEvidencePackage? evidencePackage,
        AgentOutputSemanticScore semanticScore,
        IAgentResultEmbeddingFaithfulnessScorer? embeddingFaithfulnessScorer,
        CancellationToken cancellationToken)
    {
        if (embeddingFaithfulnessScorer is null || evidencePackage is null || string.IsNullOrWhiteSpace(parsedResultJson))
            return;

        double? cosine =
            await embeddingFaithfulnessScorer.TryComputeMeanCosineAsync(parsedResultJson, evidencePackage, cancellationToken)
                .ConfigureAwait(false);

        if (cosine is { } d)
            semanticScore.AgentResultEmbeddingFaithfulnessMeanCosine = d;
    }

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

    private static async Task<TraceQualityEvaluationResult> BuildPilotStrictUnparsedResultAsync(
        AgentExecutionTrace trace,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        CancellationToken cancellationToken)
    {
        string rawJson = trace.ParsedResultJson ?? string.Empty;

        AgentOutputEvaluationScore structuralScore =
            structuralEvaluator.Evaluate(trace.TraceId, rawJson, trace.AgentType);

        AgentOutputSemanticScore semanticScore =
            await semanticEvaluator.EvaluateAsync(trace.TraceId, rawJson, trace.AgentType, cancellationToken)
                .ConfigureAwait(false);

        return new TraceQualityEvaluationResult(false, false, true, true, structuralScore, semanticScore,
            AgentOutputQualityGateOutcome.Rejected,
            "pilot_strict_unparsed_agent_output");
    }

    private static async Task<TraceQualityEvaluationResult> BuildPilotStrictEvaluatorParseFailureResultAsync(
        AgentExecutionTrace trace,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        CancellationToken cancellationToken)
    {
        AgentOutputEvaluationScore structuralScore =
            structuralEvaluator.Evaluate(trace.TraceId, trace.ParsedResultJson, trace.AgentType);

        AgentOutputSemanticScore semanticScore =
            await semanticEvaluator.EvaluateAsync(trace.TraceId, trace.ParsedResultJson, trace.AgentType, cancellationToken)
                .ConfigureAwait(false);

        return new TraceQualityEvaluationResult(false, false, true, true, structuralScore, semanticScore,
            AgentOutputQualityGateOutcome.Rejected,
            "pilot_strict_structural_evaluator_parse_failure");
    }

    private static void ApplyPilotStrictScoreFloors(
        AgentOutputQualityGateOptions options,
        bool pilotStrict,
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (!pilotStrict)
            return;

        if (structuralScore.StructuralCompletenessRatio < options.PilotStrictMinStructuralCompleteness ||
            semanticScore.OverallSemanticScore < options.PilotStrictMinSemanticScore)
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;
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

    private static string? BuildPublicRejectionSummary(
        IAgentOutputQualityGate qualityGate,
        AgentOutputQualityGateOptions options,
        bool pilotStrict,
        string? parsedResultJson,
        AgentOutputEvaluationScore structural,
        AgentOutputSemanticScore semantic,
        AgentOutputQualityGateOutcome outcome)
    {
        if (outcome != AgentOutputQualityGateOutcome.Rejected)
            return null;

        ArgumentNullException.ThrowIfNull(qualityGate);
        ArgumentNullException.ThrowIfNull(options);

        List<string> parts = new();

        if (qualityGate.Evaluate(structural, semantic) == AgentOutputQualityGateOutcome.Rejected)
            parts.Add("quality_gate_threshold_reject");

        if (pilotStrict)
        {
            if (structural.StructuralCompletenessRatio < options.PilotStrictMinStructuralCompleteness)
                parts.Add("pilot_structural_completeness_below_floor");

            if (semantic.OverallSemanticScore < options.PilotStrictMinSemanticScore)
                parts.Add("pilot_semantic_score_below_floor");

            string json = parsedResultJson ?? string.Empty;

            if (!TryHasNonEmptyCitations(json))
                parts.Add("missing_or_empty_citations");

            if (options.PilotStrictMinEvidenceRefCount > 0 && !MeetsEvidenceRefFloor(json, options.PilotStrictMinEvidenceRefCount))
                parts.Add("evidence_ref_count_below_floor");

            if (options.PilotStrictMinAgentResultFaithfulnessSupportRatio is { } faithFloor &&
                semantic.AgentResultFaithfulnessSupportRatio is { } faithRatio &&
                faithRatio < faithFloor)
                parts.Add("agent_result_faithfulness_below_floor");
        }

        if (parts.Count == 0)
            parts.Add("quality_gate_rejected");

        return string.Join(", ", parts);
    }

    private static void ApplyCitationOutcome(bool pilotStrict,
        bool hasCitations,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (hasCitations)
            return;

        if (pilotStrict || gateOutcome == AgentOutputQualityGateOutcome.Rejected)
        {
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

            return;
        }

        gateOutcome = AgentOutputQualityGateOutcome.Warned;
    }

    private static bool MeetsEvidenceRefFloor(string parsedResultJson, int minimumCount)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return false;

            return TryCountTopLevelEvidenceRefs(doc.RootElement) >= minimumCount;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    internal static bool TryHasNonEmptyCitations(string parsedResultJson)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            return doc.RootElement.TryGetProperty("citations", out JsonElement citationsElement)
                   && citationsElement.ValueKind == JsonValueKind.Array
                   && citationsElement.GetArrayLength() > 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static int TryCountTopLevelEvidenceRefs(JsonElement root)
    {
        if (!root.TryGetProperty("evidenceRefs", out JsonElement refsElement) ||
            refsElement.ValueKind != JsonValueKind.Array)
            return 0;

        return refsElement.GetArrayLength();
    }

    /// <summary>
    ///     Confidence enrichment signal — mirrors trace gate semantics without histogram emission.
    /// </summary>
    public static async Task<bool> ComputeQualityGateAcceptedForConfidenceAsync(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOptions options,
        IAgentOutputEvaluator structuralEvaluator,
        IAgentOutputSemanticEvaluator semanticEvaluator,
        IAgentOutputQualityGate qualityGate,
        CancellationToken cancellationToken)
    {
        TraceQualityEvaluationResult? result =
            await TryEvaluateTraceAsync(
                trace,
                options,
                structuralEvaluator,
                semanticEvaluator,
                qualityGate,
                cancellationToken).ConfigureAwait(false);

        return result is { GateOutcome: not AgentOutputQualityGateOutcome.Rejected };
    }
}
