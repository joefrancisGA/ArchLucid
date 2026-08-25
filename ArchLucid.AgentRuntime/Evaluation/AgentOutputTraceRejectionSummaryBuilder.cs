using System.Collections.Generic;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Public rejection-reason tokens for <see cref="AgentOutputTraceQualityEvaluator" />.
/// </summary>
internal static class AgentOutputTraceRejectionSummaryBuilder
{
    internal static string? BuildPublicRejectionSummary(
        IAgentOutputQualityGate qualityGate,
        AgentOutputQualityGateOptions options,
        AgentOutputLlmFaithfulnessOptions faithfulnessOptions,
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

            if (!AgentOutputTraceCitationGate.TryHasNonEmptyCitations(json))
                parts.Add("missing_or_empty_citations");

            if (options.PilotStrictMinEvidenceRefCount > 0 && !AgentOutputTraceCitationGate.MeetsEvidenceRefFloor(json, options.PilotStrictMinEvidenceRefCount))
                parts.Add("evidence_ref_count_below_floor");

            if (options.PilotStrictMinAgentResultFaithfulnessSupportRatio is { } faithFloor &&
                semantic.AgentResultFaithfulnessSupportRatio is { } faithRatio &&
                faithRatio < faithFloor)
                parts.Add("agent_result_faithfulness_below_floor");
        }

        if (faithfulnessOptions.Enabled
            && faithfulnessOptions.EnforcePhaseB
            && semantic.LlmFaithfulnessScore is { } llmScore)
        {
            if (llmScore < faithfulnessOptions.MinScoreRejectBelow)
                parts.Add("llm_faithfulness_below_reject_floor");
            else if (faithfulnessOptions.MinScoreWarnBelow is { } llmWarnCeiling
                     && llmScore < llmWarnCeiling)
                parts.Add("llm_faithfulness_below_warn_floor");
        }

        if (parts.Count == 0)
            parts.Add("quality_gate_rejected");

        return string.Join(", ", parts);
    }
}
