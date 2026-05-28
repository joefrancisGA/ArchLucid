using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentOutputQualityGate" />
public sealed class AgentOutputQualityGate(IOptions<AgentOutputQualityGateOptions> options)
    : IAgentOutputQualityGate
{
    private readonly AgentOutputQualityGateOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    /// <inheritdoc />
    public AgentOutputQualityGateOutcome Evaluate(
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore,
        double? calibratedConfidence = null)
    {
        ArgumentNullException.ThrowIfNull(structuralScore);
        ArgumentNullException.ThrowIfNull(semanticScore);

        if (!_options.Enabled)
            return AgentOutputQualityGateOutcome.Accepted;

        ResolveFloors(structuralScore.AgentType, out double sRej, out double semRej, out double sWarn, out double semWarn);

        double structural = structuralScore.StructuralCompletenessRatio;
        double semantic = calibratedConfidence ?? semanticScore.OverallSemanticScore;

        if (structural < sRej || semantic < semRej)
            return AgentOutputQualityGateOutcome.Rejected;

        if (structural < sWarn || semantic < semWarn)
            return AgentOutputQualityGateOutcome.Warned;

        if (_options.Mode == AgentOutputQualityGateMode.PilotStrict
            && _options.PilotStrictMinCitationCoverageRatio.HasValue
            && semanticScore.FindingCitationCoverageRatio < _options.PilotStrictMinCitationCoverageRatio)
            return AgentOutputQualityGateOutcome.Rejected;

        return AgentOutputQualityGateOutcome.Accepted;
    }

    /// <inheritdoc />
    public string ResolveRejectReasonCategory(
        AgentOutputQualityGateOutcome outcome,
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore,
        string? evaluationReason)
    {
        ArgumentNullException.ThrowIfNull(structuralScore);
        ArgumentNullException.ThrowIfNull(semanticScore);

        if (outcome != AgentOutputQualityGateOutcome.Rejected)
            return AgentOutputQualityGateTelemetry.RejectReasonNone;

        if (!string.IsNullOrWhiteSpace(evaluationReason))
        {
            if (ContainsReasonToken(evaluationReason, "faithfulness")
                || ContainsReasonToken(evaluationReason, "evidence_ref"))
                return AgentOutputQualityGateTelemetry.RejectReasonFaithfulness;

            if (ContainsReasonToken(evaluationReason, "semantic")
                || ContainsReasonToken(evaluationReason, "citations"))
                return AgentOutputQualityGateTelemetry.RejectReasonSemantic;

            if (ContainsReasonToken(evaluationReason, "quality_gate_threshold_reject"))
                return ClassifyThresholdFailure(structuralScore, semanticScore);

            return AgentOutputQualityGateTelemetry.RejectReasonStructural;
        }

        return ClassifyThresholdFailure(structuralScore, semanticScore);
    }

    private string ClassifyThresholdFailure(
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore)
    {
        ResolveFloors(
            structuralScore.AgentType,
            out double structuralReject,
            out double semanticReject,
            out _,
            out _);

        bool structuralFailed = structuralScore.StructuralCompletenessRatio < structuralReject;
        bool semanticFailed = semanticScore.OverallSemanticScore < semanticReject;

        if (structuralFailed && !semanticFailed)
            return AgentOutputQualityGateTelemetry.RejectReasonStructural;

        if (semanticFailed && !structuralFailed)
            return AgentOutputQualityGateTelemetry.RejectReasonSemantic;

        if (structuralFailed)
            return AgentOutputQualityGateTelemetry.RejectReasonStructural;

        return AgentOutputQualityGateTelemetry.RejectReasonSemantic;
    }

    private static bool ContainsReasonToken(string evaluationReason, string token) =>
        evaluationReason.Contains(token, StringComparison.OrdinalIgnoreCase);

    private void ResolveFloors(
        AgentType agentType,
        out double structuralReject,
        out double semanticReject,
        out double structuralWarn,
        out double semanticWarn)
    {
        AgentOutputQualityGateEffectiveFloorsResolver.EffectiveFloors floors =
            AgentOutputQualityGateEffectiveFloorsResolver.Resolve(_options, agentType);

        structuralWarn = floors.StructuralWarnBelow;
        semanticWarn = floors.SemanticWarnBelow;
        structuralReject = floors.StructuralRejectBelow;
        semanticReject = floors.SemanticRejectBelow;
    }
}
