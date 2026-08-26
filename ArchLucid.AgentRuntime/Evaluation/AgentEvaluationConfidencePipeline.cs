using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Shared evaluation rules for agent finding confidence enrichment (snapshot and architecture targets).
/// </summary>
public sealed class AgentEvaluationConfidencePipeline(
    IAgentExecutionTraceRepository traceRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentOutputEvaluator structuralEvaluator,
    HeuristicOnlyAgentOutputSemanticEvaluator confidenceGateSemanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IOptions<AgentOutputQualityGateOptions> gateOptions,
    AgentOutputReferenceCaseRunEvaluator referenceCaseRunEvaluator,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker,
    FindingConfidenceCalculator confidenceCalculator)
{
    private readonly IAgentExecutionTraceRepository _traceRepository =
        traceRepository ?? throw new ArgumentNullException(nameof(traceRepository));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentOutputEvaluator _structuralEvaluator =
        structuralEvaluator ?? throw new ArgumentNullException(nameof(structuralEvaluator));

    private readonly HeuristicOnlyAgentOutputSemanticEvaluator _confidenceGateSemanticEvaluator =
        confidenceGateSemanticEvaluator ?? throw new ArgumentNullException(nameof(confidenceGateSemanticEvaluator));

    private readonly IAgentOutputQualityGate _qualityGate =
        qualityGate ?? throw new ArgumentNullException(nameof(qualityGate));

    private readonly IOptions<AgentOutputQualityGateOptions> _gateOptions =
        gateOptions ?? throw new ArgumentNullException(nameof(gateOptions));

    private readonly AgentOutputReferenceCaseRunEvaluator _referenceCaseRunEvaluator =
        referenceCaseRunEvaluator ?? throw new ArgumentNullException(nameof(referenceCaseRunEvaluator));

    private readonly IAgentResultEvidenceFaithfulnessChecker _agentResultEvidenceFaithfulnessChecker =
        agentResultEvidenceFaithfulnessChecker ??
        throw new ArgumentNullException(nameof(agentResultEvidenceFaithfulnessChecker));

    private readonly FindingConfidenceCalculator _confidenceCalculator =
        confidenceCalculator ?? throw new ArgumentNullException(nameof(confidenceCalculator));

    /// <summary>
    ///     Loads traces and evidence for <paramref name="runId" />, then invokes the target-specific adapter.
    /// </summary>
    public async Task TryEnrichCoreAsync(
        string runId,
        Func<AgentEvaluationConfidenceRunContext, CancellationToken, Task> enrichAdapter,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(enrichAdapter);

        if (string.IsNullOrWhiteSpace(runId))
            return;

        string normalizedRunId = runId.Trim();
        AgentEvaluationConfidenceRunContext context = await BuildRunContextAsync(normalizedRunId, cancellationToken)
            .ConfigureAwait(false);

        await enrichAdapter(context, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    ///     Evaluates quality-gate acceptance and reference-case match for a trace.
    /// </summary>
    public async Task<(bool SchemaPassed, bool ReferenceMatched)> EvaluateTraceSignalsAsync(
        AgentExecutionTrace? trace,
        AgentEvidencePackage? evidence,
        IReadOnlyDictionary<string, double?> calibratedConfidenceByTaskId,
        CancellationToken cancellationToken)
    {
        if (trace is null)
            return (false, false);

        bool schemaPassed = await AgentOutputTraceQualityEvaluator.ComputeQualityGateAcceptedForConfidenceAsync(
            trace,
            _gateOptions.Value,
            _structuralEvaluator,
            _confidenceGateSemanticEvaluator,
            _qualityGate,
            cancellationToken,
            evidence,
            _agentResultEvidenceFaithfulnessChecker,
            calibratedConfidenceByTaskId).ConfigureAwait(false);

        bool referenceMatched = await _referenceCaseRunEvaluator
            .ComputeAnyPassingReferenceCaseAsync(trace, cancellationToken)
            .ConfigureAwait(false);

        return (schemaPassed, referenceMatched);
    }

    /// <summary>
    ///     Applies shared confidence rules to a <see cref="Finding" /> using precomputed trace signals.
    /// </summary>
    public FindingConfidenceCalculationResult ComputeFindingConfidence(
        Finding finding,
        bool schemaPassed,
        bool referenceMatched)
    {
        ArgumentNullException.ThrowIfNull(finding);

        TraceCompletenessScore completeness = ExplainabilityTraceCompletenessAnalyzer.AnalyzeFinding(finding);

        decimal? traceRatio = finding.Trace is null ? null : (decimal)completeness.CompletenessRatio;

        return _confidenceCalculator.Calculate(schemaPassed, referenceMatched, traceRatio);
    }

    /// <summary>
    ///     Resolves the execution trace backing a persisted snapshot finding.
    /// </summary>
    public static AgentExecutionTrace? ResolveTraceForSnapshotFinding(
        Finding finding,
        AgentEvaluationConfidenceRunContext context)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(context);

        string? key = finding.AgentExecutionTraceId ?? finding.Trace.SourceAgentExecutionTraceId;

        if (!string.IsNullOrWhiteSpace(key))

            foreach (AgentExecutionTrace trace in context.LatestTraces)
            {
                if (TraceIdsLikelyMatch(trace.TraceId, key))
                    return trace;
            }

        if (Enum.TryParse(finding.EngineType, ignoreCase: true, out AgentType engineType) &&
            context.TraceByAgentType.TryGetValue(engineType, out AgentExecutionTrace? byEngine))
            return byEngine;

        return null;
    }

    /// <summary>
    ///     Prefix-compare trace identifiers when full equality is unavailable.
    /// </summary>
    public static bool TraceIdsLikelyMatch(string persistedTraceId, string findingKey)
    {
        if (string.Equals(persistedTraceId, findingKey, StringComparison.OrdinalIgnoreCase))
            return true;

        int n = Math.Min(32, Math.Min(persistedTraceId.Length, findingKey.Length));

        return n != 0 && persistedTraceId.AsSpan(0, n).Equals(findingKey.AsSpan(0, n), StringComparison.OrdinalIgnoreCase);
    }

    private async Task<AgentEvaluationConfidenceRunContext> BuildRunContextAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = AmbientScopeContext.CurrentOverride ?? _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentExecutionTrace> traces =
            await _traceRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        AgentEvidencePackage? evidence =
            await _agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AgentExecutionTrace> latestTraces =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        Dictionary<AgentType, AgentExecutionTrace> traceByAgentType = latestTraces
            .GroupBy(static t => t.AgentType)
            .ToDictionary(static g => g.Key, static g => g.First());

        Dictionary<string, AgentExecutionTrace> traceByTaskId = latestTraces
            .ToDictionary(static t => t.TaskId, static t => t, StringComparer.OrdinalIgnoreCase);

        IReadOnlyList<AgentResult> agentResults =
            await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        Dictionary<string, double?> calibratedConfidenceByTaskId =
            AgentCalibratedConfidenceByTaskIdBuilder.Build(agentResults);

        return new AgentEvaluationConfidenceRunContext
        {
            Scope = scope,
            LatestTraces = latestTraces,
            TraceByAgentType = traceByAgentType,
            TraceByTaskId = traceByTaskId,
            CalibratedConfidenceByTaskId = calibratedConfidenceByTaskId,
            Evidence = evidence,
        };
    }
}
