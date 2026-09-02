using ArchLucid.Application.Agents;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Runs;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application;

public sealed partial class ReplayRunService
{
    /// <inheritdoc />
    public async Task<ReplayRunResult> ExecutePreparedReplayAsync(
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

        ArchitectureRunDetail sourceDetail = await _runDetailQueryService.GetRunDetailAsync(originalRunId, cancellationToken) ??
                                             throw new RunNotFoundException(originalRunId);
        ArchitectureRun originalRun = sourceDetail.Run;
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(originalRun.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{originalRun.RequestId}' not found.");

        ArchitectureRunDetail replayDetail = await _runDetailQueryService.GetRunDetailAsync(preparedReplayRunId, cancellationToken) ??
                                             throw new RunNotFoundException(preparedReplayRunId);
        IReadOnlyList<AgentTask> replayTasks = replayDetail.Tasks;
        bool sourceAuthorityProgress = await SourceRunHasAuthorityStageProgressAsync(originalRunId, cancellationToken)
            .ConfigureAwait(false);

        if (replayTasks.Count == 0
            && (sourceDetail.AuthorityPipelineComplete || sourceAuthorityProgress))
            return await ExecuteAuthorityPreparedReplayAsync(
                preparedReplayRunId,
                originalRunId,
                executionMode,
                commitReplay,
                manifestVersionOverride,
                request,
                sourceDetail,
                cancellationToken);

        if (sourceAuthorityProgress)
        {
            throw new InvalidOperationException(
                $"Replay blocked for run '{originalRunId}': authority stage outcomes exist; four-agent / DecisionEngineV2 replay is not permitted.");
        }

        if (replayTasks.Count == 0)
            throw new InvalidOperationException($"No tasks found for replay run '{preparedReplayRunId}'.");

        AgentEvidencePackage evidence = await _agentEvidencePackageRepository.GetByRunIdAsync(originalRunId, cancellationToken) ??
                                        throw new InvalidOperationException($"Evidence package for run '{originalRunId}' not found.");

        AgentEvidencePackage replayEvidence = CloneEvidenceForReplay(evidence, preparedReplayRunId);
        IAgentExecutor executor = _agentExecutorResolver.Resolve(executionMode);
        IReadOnlyList<AgentResult> results = await executor.ExecuteAsync(
            preparedReplayRunId,
            request,
            replayEvidence,
            replayTasks,
            cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();

        GoldenManifest? manifest = null;
        List<DecisionTraceDto> decisionTraces = [];
        List<string> warnings = [];

        if (!commitReplay)
        {
            return new ReplayRunResult
            {
                OriginalRunId = originalRunId,
                ReplayRunId = preparedReplayRunId,
                ExecutionMode = executionMode,
                Results = results.ToList(),
                Manifest = manifest,
                DecisionTraces = decisionTraces,
                Warnings = warnings
            };
        }

        string manifestVersion = string.IsNullOrWhiteSpace(manifestVersionOverride)
            ? BuildReplayManifestVersion(originalRun.CurrentManifestVersion)
            : manifestVersionOverride;
        IReadOnlyList<AgentEvaluation> evaluations =
            await _agentEvaluationService.EvaluateAsync(preparedReplayRunId, request, replayEvidence, replayTasks, results, cancellationToken);
        IReadOnlyList<DecisionNode> decisionNodes =
            await _decisionEngineV2.ResolveAsync(preparedReplayRunId, request, replayTasks, results, evaluations, cancellationToken);
        DecisionMergeResult merge = _decisionEngineService.MergeResults(
            preparedReplayRunId,
            request,
            manifestVersion,
            results,
            evaluations,
            decisionNodes,
            originalRun.CurrentManifestVersion);

        if (!merge.Success)
            throw new InvalidOperationException($"Replay merge failed: {string.Join("; ", merge.Errors)}");

        manifest = merge.Manifest;
        decisionTraces = merge.DecisionTraces.Select(DecisionTraceRecordMapper.ToDto).ToList();
        warnings = merge.Warnings;
        Guid replayGuid = Guid.Parse(preparedReplayRunId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid manifestId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();
        Guid findingsSnapshotId = Guid.NewGuid();
        Guid authorityDecisionTraceId = Guid.NewGuid();
        AuthorityChainKeying chainKeying = new(manifestId, contextSnapshotId, graphSnapshotId, findingsSnapshotId, authorityDecisionTraceId);
        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            AuthorityManifestPersistResult chainPersisted;

            if (uow.SupportsExternalTransaction)
                chainPersisted = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(
                    scope,
                    replayGuid,
                    request.SystemName,
                    manifest,
                    chainKeying,
                    TimeProvider.System.UtcNowDateTime(),
                    true,
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            else
                chainPersisted = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(
                    scope,
                    replayGuid,
                    request.SystemName,
                    manifest,
                    chainKeying,
                    TimeProvider.System.UtcNowDateTime(),
                    true,
                    cancellationToken);

            await uow.CommitAsync(cancellationToken);
            await AuthorityCommittedChainDurableAudit.TryLogAsync(
                _auditService,
                _scopeContextProvider,
                _actorContext,
                _logger,
                replayGuid,
                request.SystemName,
                chainPersisted,
                "replay-commit",
                true,
                cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        return new ReplayRunResult
        {
            OriginalRunId = originalRunId,
            ReplayRunId = preparedReplayRunId,
            ExecutionMode = executionMode,
            Results = results.ToList(),
            Manifest = manifest,
            DecisionTraces = decisionTraces,
            Warnings = warnings
        };
    }

    private async Task<ReplayRunResult> ExecuteAuthorityPreparedReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        ArchitectureRequest request,
        ArchitectureRunDetail sourceDetail,
        CancellationToken cancellationToken)
    {
        _ = manifestVersionOverride;
        _ = sourceDetail;

        ContextIngestionRequest ingestionRequest = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        ingestionRequest.RunId = Guid.Parse(preparedReplayRunId);

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

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CommitRunIdempotencyOutcome commitOutcome = await _architectureRunCommandService
            .CommitRunAsync(scope, preparedReplayRunId, request: null, idempotencyKey: null, cancellationToken)
            .ConfigureAwait(false);

        return new ReplayRunResult
        {
            OriginalRunId = originalRunId,
            ReplayRunId = preparedReplayRunId,
            ExecutionMode = executionMode,
            Results = [],
            Manifest = commitOutcome.Result.Manifest,
            DecisionTraces = commitOutcome.Result.DecisionTraces,
            Warnings = commitOutcome.Result.Warnings
        };
    }
}
