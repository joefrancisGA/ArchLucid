using ArchLucid.Contracts.Agents;
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
        AgentOutputSemanticScore semanticScore)
    {
        ArgumentNullException.ThrowIfNull(structuralScore);
        ArgumentNullException.ThrowIfNull(semanticScore);

        if (!_options.Enabled)
            return AgentOutputQualityGateOutcome.Accepted;

        ResolveFloors(structuralScore.AgentType, out double sRej, out double semRej, out double sWarn, out double semWarn);

        double structural = structuralScore.StructuralCompletenessRatio;
        double semantic = semanticScore.OverallSemanticScore;

        if (structural < sRej || semantic < semRej)
            return AgentOutputQualityGateOutcome.Rejected;

        if (structural < sWarn || semantic < semWarn)
            return AgentOutputQualityGateOutcome.Warned;

        return AgentOutputQualityGateOutcome.Accepted;
    }

    private void ResolveFloors(
        AgentType agentType,
        out double structuralReject,
        out double semanticReject,
        out double structuralWarn,
        out double semanticWarn)
    {
        structuralWarn = _options.StructuralWarnBelow;
        semanticWarn = _options.SemanticWarnBelow;
        structuralReject = _options.StructuralRejectBelow;
        semanticReject = _options.SemanticRejectBelow;

        if (!_options.PerAgentTypeFloors.TryGetValue(agentType.ToString(), out AgentTypeQualityFloors? floors))
            return;

        if (floors.StructuralWarnBelow.HasValue)
            structuralWarn = floors.StructuralWarnBelow.Value;

        if (floors.StructuralRejectBelow.HasValue)
            structuralReject = floors.StructuralRejectBelow.Value;

        if (floors.SemanticWarnBelow.HasValue)
            semanticWarn = floors.SemanticWarnBelow.Value;

        if (floors.SemanticRejectBelow.HasValue)
            semanticReject = floors.SemanticRejectBelow.Value;
    }
}
