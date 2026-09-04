using ArchLucid.Application.Agents;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Replay;

/// <inheritdoc cref="IReplayRunExecutePreparedStage" />
public sealed class ReplayRunExecutePreparedStage(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureRequestRepository requestRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentExecutorResolver agentExecutorResolver,
    IAuthorityRunOrchestrator authorityRunOrchestrator,
    IReplayRunPrepareStage prepareStage,
    IReplayRunCloneStage cloneStage,
    IReplayRunCommitStage commitStage,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IRunGovernanceScopePinService runGovernanceScopePinService,
    IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate) : IReplayRunExecutePreparedStage
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentExecutorResolver _agentExecutorResolver =
        agentExecutorResolver ?? throw new ArgumentNullException(nameof(agentExecutorResolver));

    private readonly IAuthorityRunOrchestrator _authorityRunOrchestrator =
        authorityRunOrchestrator ?? throw new ArgumentNullException(nameof(authorityRunOrchestrator));

    private readonly IReplayRunPrepareStage _prepareStage =
        prepareStage ?? throw new ArgumentNullException(nameof(prepareStage));

    private readonly IReplayRunCloneStage _cloneStage =
        cloneStage ?? throw new ArgumentNullException(nameof(cloneStage));

    private readonly IReplayRunCommitStage _commitStage =
        commitStage ?? throw new ArgumentNullException(nameof(commitStage));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunGovernanceScopePinService _runGovernanceScopePinService =
        runGovernanceScopePinService ?? throw new ArgumentNullException(nameof(runGovernanceScopePinService));

    private readonly IReRunExecuteSealedManifestPinGate _reRunExecuteSealedManifestPinGate =
        reRunExecuteSealedManifestPinGate ?? throw new ArgumentNullException(nameof(reRunExecuteSealedManifestPinGate));

    /// <inheritdoc />
    public async Task<ReplayRunResult> ExecuteAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode = ExecutionModes.Current,
        bool commitReplay = false,
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(preparedReplayRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(executionMode);

        await ReplayRunSourceSealedManifestPinGuard.EnsureSourceRunReadyOrThrowAsync(
            originalRunId,
            _reRunExecuteSealedManifestPinGate,
            cancellationToken).ConfigureAwait(false);

        ArchitectureRunDetail sourceDetail = await _runDetailQueryService.GetRunDetailAsync(originalRunId, cancellationToken) ??
                                             throw new RunNotFoundException(originalRunId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (Guid.TryParse(originalRunId, out Guid originalGuid))
        {
            RunRecord? sourceHeader = await _runRepository.GetByIdAsync(scope, originalGuid, cancellationToken);

            if (sourceHeader is null)
            {
                throw new ConflictException(
                    $"Replay blocked for run '{originalRunId}': source run header was not found; evidence clone requires create-time pins.");
            }

            ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow(scope, sourceHeader, originalRunId);
        }

        ArchitectureRun originalRun = sourceDetail.Run;
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(originalRun.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{originalRun.RequestId}' not found.");

        ArchitectureRunDetail replayDetail = await _runDetailQueryService.GetRunDetailAsync(preparedReplayRunId, cancellationToken) ??
                                             throw new RunNotFoundException(preparedReplayRunId);
        IReadOnlyList<AgentTask> replayTasks = replayDetail.Tasks;
        bool sourceAuthorityProgress = await _prepareStage.SourceRunHasAuthorityStageProgressAsync(originalRunId, cancellationToken)
            .ConfigureAwait(false);

        if (replayTasks.Count == 0
            && (sourceDetail.AuthorityPipelineComplete || sourceAuthorityProgress))
            return await ExecuteAuthorityPreparedReplayAsync(
                preparedReplayRunId,
                originalRunId,
                executionMode,
                commitReplay,
                request,
                cancellationToken);

        if (sourceAuthorityProgress)
        {
            throw new InvalidOperationException(
                $"Replay blocked for run '{originalRunId}': authority stage outcomes exist; four-agent / DecisionEngineV2 replay is not permitted.");
        }

        if (replayTasks.Count == 0 && sourceDetail.AuthorityPipelineComplete)
            return await ExecuteAuthorityPreparedReplayAsync(
                preparedReplayRunId,
                originalRunId,
                executionMode,
                commitReplay,
                request,
                cancellationToken);

        if (replayTasks.Count == 0)
            throw new InvalidOperationException($"No tasks found for replay run '{preparedReplayRunId}'.");

        AgentEvidencePackage evidence = await _agentEvidencePackageRepository.GetByRunIdAsync(originalRunId, cancellationToken) ??
                                        throw new InvalidOperationException($"Evidence package for run '{originalRunId}' not found.");

        AgentEvidencePackage replayEvidence = _cloneStage.CloneEvidenceForReplay(evidence, preparedReplayRunId);
        IAgentExecutor executor = _agentExecutorResolver.Resolve(executionMode);
        IReadOnlyList<AgentResult> results = await executor.ExecuteAsync(
            preparedReplayRunId,
            request,
            replayEvidence,
            replayTasks,
            cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();

        if (!commitReplay)
        {
            return new ReplayRunResult
            {
                OriginalRunId = originalRunId,
                ReplayRunId = preparedReplayRunId,
                ExecutionMode = executionMode,
                Results = results.ToList(),
                Manifest = null,
                DecisionTraces = [],
                Warnings = []
            };
        }

        return await _commitStage.CommitFourAgentReplayAsync(
            preparedReplayRunId,
            originalRunId,
            executionMode,
            request,
            originalRun,
            results,
            replayEvidence,
            replayTasks,
            manifestVersionOverride,
            cancellationToken);
    }

    private async Task<ReplayRunResult> ExecuteAuthorityPreparedReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        bool commitReplay,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ContextIngestionRequest ingestionRequest = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        ingestionRequest.RunId = Guid.Parse(preparedReplayRunId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? replayHeader = await _runRepository
            .GetByIdAsync(scope, Guid.Parse(preparedReplayRunId), cancellationToken)
            .ConfigureAwait(false);

        using IDisposable restoredPilotScope = _runGovernanceScopePinService.BeginRestoredScope(replayHeader);

        await _authorityRunOrchestrator
            .CompleteQueuedAuthorityPipelineAsync(ingestionRequest, cancellationToken)
            .ConfigureAwait(false);

        if (!commitReplay)
        {
            return new ReplayRunResult
            {
                OriginalRunId = originalRunId,
                ReplayRunId = preparedReplayRunId,
                ExecutionMode = executionMode,
                Results = [],
                Manifest = null,
                DecisionTraces = [],
                Warnings = []
            };
        }

        return await _commitStage.CommitAuthorityReplayAsync(
            preparedReplayRunId,
            originalRunId,
            executionMode,
            cancellationToken);
    }
}
