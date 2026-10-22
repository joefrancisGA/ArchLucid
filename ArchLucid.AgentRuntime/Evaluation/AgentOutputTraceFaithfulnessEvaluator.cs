using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Evidence-token, embedding, and LLM Phase B faithfulness steps used by
///     <see cref="AgentOutputTraceQualityEvaluator" />.
/// </summary>
internal static class AgentOutputTraceFaithfulnessEvaluator
{
    internal static void ApplyAgentResultEvidenceFaithfulness(
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

        if (!pilotStrict)
            return;

        if (!report.HasCheckableContent)
        {
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

            return;
        }

        if (options.PilotStrictMinAgentResultFaithfulnessSupportRatio is not { } floor)
            return;

        if (report.SupportRatio < floor)
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;
    }

    internal static async Task ApplyAgentResultEmbeddingFaithfulnessAsync(
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

    internal static async Task<double?> EvaluateLlmFaithfulnessScoreAsync(
        AgentExecutionTrace trace,
        AgentEvidencePackage? evidencePackage,
        AgentOutputSemanticScore semanticScore,
        IAgentOutputFaithfulnessEvaluator? llmFaithfulnessEvaluator,
        CancellationToken cancellationToken)
    {
        if (llmFaithfulnessEvaluator is null || evidencePackage is null || string.IsNullOrWhiteSpace(trace.ParsedResultJson))
            return null;

        double? score =
            await llmFaithfulnessEvaluator.TryEvaluateAsync(
                    trace.TraceId,
                    trace.ParsedResultJson,
                    evidencePackage,
                    cancellationToken)
                .ConfigureAwait(false);

        if (score is { } faithfulness)
            semanticScore.LlmFaithfulnessScore = faithfulness;

        return score;
    }

    /// <summary>
    ///     Phase B LLM-faithfulness reject/warn floors. Kept <see langword="internal" /> for InternalsVisibleTo callers.
    /// </summary>
    internal static void ApplyLlmFaithfulnessPhaseBEnforcement(
        double? llmFaithfulnessScore,
        AgentOutputLlmFaithfulnessOptions faithfulnessOptions,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (!faithfulnessOptions.Enabled || !faithfulnessOptions.EnforcePhaseB)
            return;

        if (llmFaithfulnessScore is not { } faithfulness)
            return;

        if (faithfulness < faithfulnessOptions.MinScoreRejectBelow)
        {
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

            return;
        }

        if (faithfulnessOptions.MinScoreWarnBelow is { } warnCeiling
            && faithfulness < warnCeiling
            && gateOutcome == AgentOutputQualityGateOutcome.Accepted)
            gateOutcome = AgentOutputQualityGateOutcome.Warned;
    }
}
