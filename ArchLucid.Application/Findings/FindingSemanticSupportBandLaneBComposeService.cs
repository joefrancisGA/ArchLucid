using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Findings;

/// <summary>
///     AS-058: read-path Lane B compose — loads persisted traces + evidence only; does not enqueue eval jobs.
/// </summary>
public sealed class FindingSemanticSupportBandLaneBComposeService(
    IAgentExecutionTraceRepository traceRepository,
    IAgentEvidencePackageRepository evidencePackageRepository,
    IAgentResultEvidenceFaithfulnessChecker faithfulnessChecker) : IFindingSemanticSupportBandLaneBComposeService
{
    private readonly IAgentExecutionTraceRepository _traceRepository =
        traceRepository ?? throw new ArgumentNullException(nameof(traceRepository));

    private readonly IAgentEvidencePackageRepository _evidencePackageRepository =
        evidencePackageRepository ?? throw new ArgumentNullException(nameof(evidencePackageRepository));

    private readonly IAgentResultEvidenceFaithfulnessChecker _faithfulnessChecker =
        faithfulnessChecker ?? throw new ArgumentNullException(nameof(faithfulnessChecker));

    public async Task ApplyToAgentResultsAsync(
        string runId,
        ScopeContext scope,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count == 0 || string.IsNullOrWhiteSpace(runId))
            return;

        IReadOnlyList<AgentExecutionTrace> traces =
            await _traceRepository.GetByRunIdAsync(scope, runId.Trim(), cancellationToken).ConfigureAwait(false);

        if (traces.Count == 0)
        {
            FindingSemanticSupportBandLaneBComposeApplicator.ApplyToAgentResults(
                results,
                new Dictionary<string, AgentOutputSemanticScore>(StringComparer.Ordinal),
                new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

            return;
        }

        IReadOnlyList<AgentExecutionTrace> latestTraces =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        AgentEvidencePackage? evidence =
            await _evidencePackageRepository.GetByRunIdAsync(runId.Trim(), cancellationToken).ConfigureAwait(false);

        Dictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId =
            FindingSemanticSupportBandLaneBSemanticScoreIndex.BuildFromTraces(
                latestTraces,
                evidence,
                _faithfulnessChecker);

        Dictionary<string, string> traceIdByTaskId =
            FindingSemanticSupportBandLaneBSemanticScoreIndex.BuildTraceIdByTaskId(latestTraces);

        FindingSemanticSupportBandLaneBComposeApplicator.ApplyToAgentResults(
            results,
            semanticScoresByTraceId,
            traceIdByTaskId);
    }
}
