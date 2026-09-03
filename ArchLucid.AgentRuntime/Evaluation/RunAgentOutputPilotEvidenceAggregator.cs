using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;

using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IRunAgentOutputPilotEvidenceAggregator" />
public sealed class RunAgentOutputPilotEvidenceAggregator(
    IAgentOutputQualityGateOptionsResolver optionsResolver,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentResultRepository agentResultRepository,
    IAgentOutputEvaluator structuralEvaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker,
    IAgentOutputFaithfulnessEvaluator llmFaithfulnessEvaluator,
    IOptions<AgentOutputLlmFaithfulnessOptions> llmFaithfulnessOptions) : IRunAgentOutputPilotEvidenceAggregator
{
    private readonly IAgentOutputQualityGateOptionsResolver _optionsResolver =
        optionsResolver ?? throw new ArgumentNullException(nameof(optionsResolver));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAgentResultEvidenceFaithfulnessChecker _agentResultEvidenceFaithfulnessChecker =
        agentResultEvidenceFaithfulnessChecker ??
        throw new ArgumentNullException(nameof(agentResultEvidenceFaithfulnessChecker));

    private readonly IAgentOutputEvaluator _structuralEvaluator =
        structuralEvaluator ?? throw new ArgumentNullException(nameof(structuralEvaluator));

    private readonly IAgentOutputSemanticEvaluator _semanticEvaluator =
        semanticEvaluator ?? throw new ArgumentNullException(nameof(semanticEvaluator));

    private readonly IAgentOutputQualityGate _qualityGate =
        qualityGate ?? throw new ArgumentNullException(nameof(qualityGate));

    private readonly IAgentOutputFaithfulnessEvaluator _llmFaithfulnessEvaluator =
        llmFaithfulnessEvaluator ?? throw new ArgumentNullException(nameof(llmFaithfulnessEvaluator));

    private readonly IOptions<AgentOutputLlmFaithfulnessOptions> _llmFaithfulnessOptions =
        llmFaithfulnessOptions ?? throw new ArgumentNullException(nameof(llmFaithfulnessOptions));

    /// <inheritdoc />
    public async Task<bool> WouldPilotStrictBlockSponsorEvidenceAsync(
        IReadOnlyList<AgentExecutionTrace> traces,
        RunExplanationSummary? explanationSummary,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traces);

        AgentOutputQualityGateOptions options = _optionsResolver.Resolve(cancellationToken);

        if (!options.Enabled || options.Mode != AgentOutputQualityGateMode.PilotStrict)
            return false;

        if (traces.Count == 0)
            return false;

        AgentEvidencePackage? evidence =
            await _agentEvidencePackageRepository.GetByRunIdAsync(traces[0].RunId, cancellationToken)
                .ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> agentResults =
            await _agentResultRepository.GetByRunIdAsync(scope, traces[0].RunId, cancellationToken).ConfigureAwait(false);

        Dictionary<string, double?> calibratedConfidenceByTaskId =
            AgentCalibratedConfidenceByTaskIdBuilder.Build(agentResults);

        IReadOnlyList<AgentExecutionTrace> tracesForEvaluation =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        foreach (AgentExecutionTrace trace in tracesForEvaluation)
        {
            AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? evaluated =
                await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                        trace,
                        options,
                        _structuralEvaluator,
                        _semanticEvaluator,
                        _qualityGate,
                        cancellationToken,
                        evidence,
                        _agentResultEvidenceFaithfulnessChecker,
                        llmFaithfulnessEvaluator: _llmFaithfulnessEvaluator,
                        calibratedConfidenceByTaskId: calibratedConfidenceByTaskId,
                        llmFaithfulnessOptions: _llmFaithfulnessOptions.Value)
                    .ConfigureAwait(false);

            if (evaluated is { GateOutcome: AgentOutputQualityGateOutcome.Rejected })
                return true;
        }

        if (options.PilotStrictMinFaithfulnessSupportRatio is not { } minFaith)
            return false;

        double? ratio = explanationSummary?.FaithfulnessSupportRatio;

        return ratio is { } fr && fr < minFaith;
    }
}
