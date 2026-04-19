using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentOutputQualityGate"/>
public sealed class AgentOutputQualityGate(IOptions<AgentOutputQualityGateOptions> options) : IAgentOutputQualityGate
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

        if (!_options.Enabled) return AgentOutputQualityGateOutcome.Accepted;


        double structural = structuralScore.StructuralCompletenessRatio;
        double semantic = semanticScore.OverallSemanticScore;

        if (structural < _options.StructuralRejectBelow || semantic < _options.SemanticRejectBelow) return AgentOutputQualityGateOutcome.Rejected;


        if (structural < _options.StructuralWarnBelow || semantic < _options.SemanticWarnBelow) return AgentOutputQualityGateOutcome.Warned;


        return AgentOutputQualityGateOutcome.Accepted;
    }
}
