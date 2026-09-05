using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Architecture;
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
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Replay;

/// <inheritdoc cref="IReplayRunCommitStage" />
public sealed class ReplayRunCommitStage(
    IDecisionEngineService decisionEngineService,
    IAgentEvaluationService agentEvaluationService,
    IDecisionEngineV2 decisionEngineV2,
    IScopeContextProvider scopeContextProvider,
    IAuthorityCommittedManifestChainWriter authorityCommittedManifestChainWriter,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IAuditService auditService,
    IActorContext actorContext,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    ICommitRunIdempotencyCoordinator commitRunIdempotencyCoordinator,
    IRunRepository authorityRunRepository,
    IRunPolicyPackPinService runPolicyPackPinService,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IReplayRunCloneStage cloneStage,
    IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate,
    ILogger<ReplayRunCommitStage> logger) : IReplayRunCommitStage
{
    private readonly IDecisionEngineService _decisionEngineService =
        decisionEngineService ?? throw new ArgumentNullException(nameof(decisionEngineService));

    private readonly IAgentEvaluationService _agentEvaluationService =
        agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IDecisionEngineV2 _decisionEngineV2 =
        decisionEngineV2 ?? throw new ArgumentNullException(nameof(decisionEngineV2));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityCommittedManifestChainWriter _authorityCommittedManifestChainWriter =
        authorityCommittedManifestChainWriter ?? throw new ArgumentNullException(nameof(authorityCommittedManifestChainWriter));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IArchitectureRunCommitOrchestrator _architectureRunCommitOrchestrator =
        architectureRunCommitOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCommitOrchestrator));

    private readonly ICommitRunIdempotencyCoordinator _commitRunIdempotencyCoordinator =
        commitRunIdempotencyCoordinator ?? throw new ArgumentNullException(nameof(commitRunIdempotencyCoordinator));

    private readonly IRunRepository _authorityRunRepository =
        authorityRunRepository ?? throw new ArgumentNullException(nameof(authorityRunRepository));

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IReplayRunCloneStage _cloneStage =
        cloneStage ?? throw new ArgumentNullException(nameof(cloneStage));

    private readonly IReRunExecuteSealedManifestPinGate _reRunExecuteSealedManifestPinGate =
        reRunExecuteSealedManifestPinGate ?? throw new ArgumentNullException(nameof(reRunExecuteSealedManifestPinGate));

    private readonly ILogger<ReplayRunCommitStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ReplayRunResult> CommitFourAgentReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        ArchitectureRequest request,
        ArchitectureRun originalRun,
        IReadOnlyList<AgentResult> results,
        AgentEvidencePackage replayEvidence,
        IReadOnlyList<AgentTask> replayTasks,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(preparedReplayRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(executionMode);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(originalRun);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(replayEvidence);
        ArgumentNullException.ThrowIfNull(replayTasks);

        await ReplayRunSourceSealedManifestPinGuard.EnsureSourceRunReadyOrThrowAsync(
            originalRunId,
            _reRunExecuteSealedManifestPinGate,
            cancellationToken).ConfigureAwait(false);

        string manifestVersion = string.IsNullOrWhiteSpace(manifestVersionOverride)
            ? _cloneStage.BuildReplayManifestVersion(originalRun.CurrentManifestVersion)
            : manifestVersionOverride;
        IReadOnlyList<AgentEvaluation> evaluations =
            await _agentEvaluationService.EvaluateAsync(
                preparedReplayRunId,
                request,
                replayEvidence,
                replayTasks,
                results,
                cancellationToken);
        IReadOnlyList<DecisionNode> decisionNodes =
            await _decisionEngineV2.ResolveAsync(
                preparedReplayRunId,
                request,
                replayTasks,
                results,
                evaluations,
                cancellationToken);
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

        GoldenManifest manifest = merge.Manifest;
        List<DecisionTraceDto> decisionTraces = merge.DecisionTraces.Select(DecisionTraceRecordMapper.ToDto).ToList();
        List<string> warnings = merge.Warnings;
        Guid replayGuid = Guid.Parse(preparedReplayRunId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? replayHeader = await _authorityRunRepository.GetByIdAsync(scope, replayGuid, cancellationToken);

        if (replayHeader is not null)
        {
            RunRecord? sourceHeader = null;

            if (Guid.TryParse(originalRunId, out Guid originalGuid))
                sourceHeader = await _authorityRunRepository.GetByIdAsync(scope, originalGuid, cancellationToken);

            if (sourceHeader is not null)
            {
                ReplayRunScopeAssertionGuard.EnsureReplayHeaderMatchesSourceScopeOrThrow(
                    replayHeader,
                    sourceHeader,
                    originalRunId);
            }

            await _runPolicyPackPinService
                .VerifyPinIntegrityOrThrowAsync(replayHeader, scope, cancellationToken)
                .ConfigureAwait(false);
            await _runEvidencePackagePinService
                .VerifyPinIntegrityOrThrowAsync(replayHeader, scope, cancellationToken)
                .ConfigureAwait(false);
        }

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

    /// <inheritdoc />
    public async Task<ReplayRunResult> CommitAuthorityReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(preparedReplayRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(executionMode);

        await ReplayRunSourceSealedManifestPinGuard.EnsureSourceRunReadyOrThrowAsync(
            originalRunId,
            _reRunExecuteSealedManifestPinGate,
            cancellationToken).ConfigureAwait(false);

        CommitRunIdempotencyOutcome commitOutcome = await _commitRunIdempotencyCoordinator
            .CommitAsync(
                null,
                token => _architectureRunCommitOrchestrator.CommitRunAsync(preparedReplayRunId, null, token),
                cancellationToken)
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
