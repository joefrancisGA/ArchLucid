using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>Persists run-level engine provenance after agent execute completes.</summary>
public interface IRunEngineProvenanceCaptureService
{
    Task TryCaptureAndPersistAsync(
        string runId,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IRunEngineProvenanceCaptureService" />
public sealed class RunEngineProvenanceCaptureService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ILlmCostEstimator llmCostEstimator) : IRunEngineProvenanceCaptureService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    /// <inheritdoc />
    public async Task TryCaptureAndPersistAsync(
        string runId,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(evidence);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        ReviewRunEngineProvenance? selectionProvenance =
            ReviewRunEngineProvenanceJson.TryDeserialize(header.EngineProvenanceJson);

        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository
                .GetByRunIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);

        FindingsSnapshot? findingsSnapshot = null;

        if (header.FindingsSnapshotId.HasValue)
        {
            findingsSnapshot = await _findingsSnapshotRepository
                .GetByIdAsync(scope, header.FindingsSnapshotId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        ReviewRunEngineProvenance executionProvenance = ReviewRunEngineProvenanceAggregator.Aggregate(
            traces,
            evidence,
            header,
            findingsSnapshot,
            _llmCostEstimator);

        ReviewRunEngineProvenance provenance =
            ReviewRunEngineProvenanceMerger.MergeSelectionWithExecution(selectionProvenance, executionProvenance);

        header.EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(provenance);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
