using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;

using Microsoft.Extensions.Options;

using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IRunAgentOutputPilotEvidenceAggregator" />
public sealed class RunAgentOutputPilotEvidenceAggregator(
    IOptions<AgentOutputQualityGateOptions> options,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentOutputEvaluator structuralEvaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker) : IRunAgentOutputPilotEvidenceAggregator
{
    private readonly AgentOutputQualityGateOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultEvidenceFaithfulnessChecker _agentResultEvidenceFaithfulnessChecker =
        agentResultEvidenceFaithfulnessChecker ??
        throw new ArgumentNullException(nameof(agentResultEvidenceFaithfulnessChecker));

    private readonly IAgentOutputEvaluator _structuralEvaluator =
        structuralEvaluator ?? throw new ArgumentNullException(nameof(structuralEvaluator));

    private readonly IAgentOutputSemanticEvaluator _semanticEvaluator =
        semanticEvaluator ?? throw new ArgumentNullException(nameof(semanticEvaluator));

    private readonly IAgentOutputQualityGate _qualityGate =
        qualityGate ?? throw new ArgumentNullException(nameof(qualityGate));

    /// <inheritdoc />
    public async Task<bool> WouldPilotStrictBlockSponsorEvidenceAsync(
        IReadOnlyList<AgentExecutionTrace> traces,
        RunExplanationSummary? explanationSummary,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traces);

        if (!_options.Enabled || _options.Mode != AgentOutputQualityGateMode.PilotStrict)
            return false;

        if (traces.Count == 0)
            return false;

        AgentEvidencePackage? evidence =
            await _agentEvidencePackageRepository.GetByRunIdAsync(traces[0].RunId, cancellationToken)
                .ConfigureAwait(false);

        foreach (AgentExecutionTrace trace in traces)
        {
            AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? evaluated =
                await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                        trace,
                        _options,
                        _structuralEvaluator,
                        _semanticEvaluator,
                        _qualityGate,
                        cancellationToken,
                        evidence,
                        _agentResultEvidenceFaithfulnessChecker)
                    .ConfigureAwait(false);

            if (evaluated is { GateOutcome: AgentOutputQualityGateOutcome.Rejected })
                return true;
        }

        if (_options.PilotStrictMinFaithfulnessSupportRatio is not { } minFaith)
            return false;

        double? ratio = explanationSummary?.FaithfulnessSupportRatio;

        return ratio is { } fr && fr < minFaith;
    }
}
