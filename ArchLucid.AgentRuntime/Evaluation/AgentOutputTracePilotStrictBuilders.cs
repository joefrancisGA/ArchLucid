using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     PilotStrict unparsed/parse-failure results and structural/semantic score floors for
///     <see cref="AgentOutputTraceQualityEvaluator" />.
/// </summary>
internal static class AgentOutputTracePilotStrictBuilders
{
    internal static async Task<AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult> BuildPilotStrictUnparsedResultAsync(
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

        return new AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult(false, false, true, true, structuralScore, semanticScore,
            AgentOutputQualityGateOutcome.Rejected,
            "pilot_strict_unparsed_agent_output");
    }

    internal static async Task<AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult> BuildPilotStrictEvaluatorParseFailureResultAsync(
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

        return new AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult(false, false, true, true, structuralScore, semanticScore,
            AgentOutputQualityGateOutcome.Rejected,
            "pilot_strict_structural_evaluator_parse_failure");
    }

    internal static void ApplyPilotStrictScoreFloors(
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
}
