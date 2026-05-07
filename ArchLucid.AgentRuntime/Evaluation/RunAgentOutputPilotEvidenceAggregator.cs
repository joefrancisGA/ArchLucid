using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IRunAgentOutputPilotEvidenceAggregator" />
public sealed class RunAgentOutputPilotEvidenceAggregator(
    IOptions<AgentOutputQualityGateOptions> options,
    IAgentOutputEvaluator structuralEvaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate) : IRunAgentOutputPilotEvidenceAggregator
{
    private readonly AgentOutputQualityGateOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    private readonly IAgentOutputEvaluator _structuralEvaluator =
        structuralEvaluator ?? throw new ArgumentNullException(nameof(structuralEvaluator));

    private readonly IAgentOutputSemanticEvaluator _semanticEvaluator =
        semanticEvaluator ?? throw new ArgumentNullException(nameof(semanticEvaluator));

    private readonly IAgentOutputQualityGate _qualityGate =
        qualityGate ?? throw new ArgumentNullException(nameof(qualityGate));

    /// <inheritdoc />
    public bool WouldPilotStrictBlockSponsorEvidence(
        IReadOnlyList<AgentExecutionTrace> traces,
        RunExplanationSummary? explanationSummary)
    {
        ArgumentNullException.ThrowIfNull(traces);

        if (!_options.Enabled || _options.Mode != AgentOutputQualityGateMode.PilotStrict)
            return false;

        foreach (AgentExecutionTrace trace in traces)
        {
            AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? evaluated =
                AgentOutputTraceQualityEvaluator.TryEvaluateTrace(
                    trace,
                    _options,
                    _structuralEvaluator,
                    _semanticEvaluator,
                    _qualityGate);

            if (evaluated is { GateOutcome: AgentOutputQualityGateOutcome.Rejected })
                return true;
        }

        if (_options.PilotStrictMinFaithfulnessSupportRatio is not double minFaith)
            return false;

        double? ratio = explanationSummary?.FaithfulnessSupportRatio;

        return ratio is double fr && fr < minFaith;
    }
}
