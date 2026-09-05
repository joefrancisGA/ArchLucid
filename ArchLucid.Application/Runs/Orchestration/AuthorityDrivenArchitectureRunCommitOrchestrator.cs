using System.Diagnostics;

using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref = "IArchitectureRunCommitOrchestrator"/>
public sealed class AuthorityDrivenArchitectureRunCommitOrchestrator(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IArchitectureRequestRepository requestRepository,
    IAgentResultRepository agentResultRepository,
    IActorContext actorContext,
    IRunStateTransitionService runStateTransitionService,
    IAuthorityCommitIdempotencyHandler idempotencyHandler,
    IAuthorityCommitDecisionMaterializationStage decisionMaterializationStage,
    IAuthorityCommitGovernanceStage governanceStage,
    IAuthorityCommitPersistenceStage persistenceStage,
    IAuthorityCommitFailureRecorder failureRecorder,
    IGoldenManifestRepository goldenManifestRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    IManifestHashService manifestHashService,
    ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator> logger) : IArchitectureRunCommitOrchestrator
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAuthorityCommitIdempotencyHandler _idempotencyHandler =
        idempotencyHandler ?? throw new ArgumentNullException(nameof(idempotencyHandler));

    private readonly IAuthorityCommitDecisionMaterializationStage _decisionMaterializationStage =
        decisionMaterializationStage ?? throw new ArgumentNullException(nameof(decisionMaterializationStage));

    private readonly IAuthorityCommitGovernanceStage _governanceStage =
        governanceStage ?? throw new ArgumentNullException(nameof(governanceStage));

    private readonly IAuthorityCommitPersistenceStage _persistenceStage =
        persistenceStage ?? throw new ArgumentNullException(nameof(persistenceStage));

    private readonly IAuthorityCommitFailureRecorder _failureRecorder =
        failureRecorder ?? throw new ArgumentNullException(nameof(failureRecorder));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder =
        projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    /// <inheritdoc/>
    public Task<CommitRunResult> CommitRunAsync(string runId, CancellationToken cancellationToken = default) =>
        CommitRunAsync(runId, null, cancellationToken);

    /// <inheritdoc/>
    public async Task<CommitRunResult> CommitRunAsync(string runId, CommitRunRequest? request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        string actor = _actorContext.GetActor();
        Stopwatch commitRetryStopwatch = Stopwatch.StartNew();
        for (int attempt = 1; attempt <= CommitRunTransientRetryPolicy.MaxAttempts; attempt++)
            try
            {
                return await CommitRunCoreAsync(runId, actor, request, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (RunNotFoundException)
            {
                await _failureRecorder.RecordFailureAsync(actor, runId, "Run not found.", cancellationToken);
                throw;
            }
            catch (Exception ex) when (SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex))
            {
                for (int reconcilePoll = 1; reconcilePoll <= CommitRunTransientRetryPolicy.ManifestReconcilePollAttempts; reconcilePoll++)
                {
                    CommitRunResult? reconciled = await TryReconcileAfterConcurrentCommitAsync(runId, cancellationToken);

                    if (reconciled is not null)
                        return reconciled;

                    if (reconcilePoll < CommitRunTransientRetryPolicy.ManifestReconcilePollAttempts)
                    {
                        await Task.Delay(
                            CommitRunTransientRetryPolicy.ManifestReconcilePollDelay(reconcilePoll),
                            cancellationToken);
                    }
                }

                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(ex,
                        "CommitRunAsync (authority) unique-key violation without reconcilable manifest (attempt {Attempt}/{Max}) for RunId={RunId}.", attempt,
                        CommitRunTransientRetryPolicy.MaxAttempts, LogSanitizer.Sanitize(runId));

                if (IsCommitRetryBudgetExhausted(attempt, commitRetryStopwatch))
                    throw new ConflictException(
                        $"Commit for run '{runId}' raced with another commit. The manifest could not be loaded yet; retry the request.");

                await Task.Delay(CommitRunTransientRetryPolicy.RetryDelay(attempt), cancellationToken);
            }
            catch (Exception ex) when (SqlTransientDetector.IsTransient(ex))
            {
                if (IsCommitRetryBudgetExhausted(attempt, commitRetryStopwatch))
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex,
                            "CommitRunAsync (authority) transient database error exhausted retry budget (attempt {Attempt}/{Max}, elapsed {ElapsedMs}ms) for RunId={RunId}; returning conflict for client retry.",
                            attempt, CommitRunTransientRetryPolicy.MaxAttempts, commitRetryStopwatch.ElapsedMilliseconds, LogSanitizer.Sanitize(runId));

                    throw new ConflictException(
                        $"Commit for run '{runId}' hit a transient database condition that did not clear in time. Retry the request.");
                }

                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(ex, "CommitRunAsync (authority) transient database error (attempt {Attempt}/{Max}) for RunId={RunId}; retrying.",
                        attempt, CommitRunTransientRetryPolicy.MaxAttempts, LogSanitizer.Sanitize(runId));
                await Task.Delay(CommitRunTransientRetryPolicy.RetryDelay(attempt), cancellationToken);
            }
            catch (ConflictException cex) when (cex.Message.Contains("stale run row version", StringComparison.OrdinalIgnoreCase))
            {
                CommitRunResult? reconciled = await TryReconcileAfterConcurrentCommitAsync(runId, cancellationToken);

                if (reconciled is not null)
                    return reconciled;

                if (IsCommitRetryBudgetExhausted(attempt, commitRetryStopwatch))
                    throw;

                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(cex,
                        "CommitRunAsync (authority) stale run row version (attempt {Attempt}/{Max}) for RunId={RunId}; retrying.",
                        attempt, CommitRunTransientRetryPolicy.MaxAttempts, LogSanitizer.Sanitize(runId));
                await Task.Delay(CommitRunTransientRetryPolicy.RetryDelay(attempt), cancellationToken);
            }

        throw new InvalidOperationException("CommitRunAsync (authority) exhausted transient retries without returning.");
    }

    private static bool IsCommitRetryBudgetExhausted(int attempt, Stopwatch commitRetryStopwatch) =>
        CommitRunTransientRetryPolicy.IsExhausted(attempt, commitRetryStopwatch.Elapsed);

    private async Task<CommitRunResult?> TryReconcileAfterConcurrentCommitAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRun? runAgain =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(_runRepository, _scopeContextProvider, _taskRepository, runId, cancellationToken);

        if (runAgain is null)
            return null;
        return await _idempotencyHandler.TryReturnCommittedAsync(runAgain, runId, cancellationToken);
    }

    private async Task<CommitRunResult> CommitRunCoreAsync(
        string runId,
        string actor,
        CommitRunRequest? commitOptions,
        CancellationToken cancellationToken)
    {
        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Committing architecture run (authority): RunId={RunId}", LogSanitizer.Sanitize(runId));

        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
            throw new RunNotFoundException(runId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? runRecord = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (runRecord is null)
            throw new RunNotFoundException(runId);

        RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow(scope, runRecord, runId, "Commit");

        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunFromRecordAsync(_scopeContextProvider, _taskRepository, runId, runRecord,
                cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);
        AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, runRecord, runId);

        if (runRecord.GoldenManifestId is Guid goldenManifestId)
        {
            ManifestDocument? persistedManifest =
                await _goldenManifestRepository.GetByIdAsync(scope, goldenManifestId, cancellationToken);

            if (persistedManifest is null)
            {
                throw new ConflictException(
                    $"Commit recovery blocked for run '{runId}': golden manifest id is set but the manifest row is missing.");
            }

            ArchitectureRequest recoveryRequest = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                                  throw new InvalidOperationException(
                                                      $"Request '{run.RequestId}' not found.");

            ManifestCommittedArtifactInventoryMaterial recomputedMaterial =
                await ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.BuildAsync(
                    scope,
                    persistedManifest,
                    runRecord,
                    recoveryRequest,
                    _findingsSnapshotRepository,
                    _decisionTraceRepository,
                    _artifactBundleRepository,
                    _projectionBuilder,
                    cancellationToken);

            AuthorityCommitRecoveryVerifier.EnsureInventoryConsistentOrThrow(
                persistedManifest,
                runRecord,
                runId,
                recomputedMaterial);

            AuthorityCommitRecoveryVerifier.EnsureSealedManifestHashMatchesOrThrow(
                persistedManifest,
                runId,
                _manifestHashService);

            string manifestVersion = !string.IsNullOrWhiteSpace(persistedManifest.Metadata?.Version)
                ? persistedManifest.Metadata.Version
                : run.CurrentManifestVersion ?? string.Empty;

            AuthorityCommitRecoveryVerifier.EnsureDecisionReceiptHashConsistentOrThrow(
                persistedManifest,
                runGuid,
                manifestVersion,
                runId,
                _manifestHashService);
        }

        CommitRunResult? idempotent = await _idempotencyHandler.TryReturnCommittedAsync(run, runId, cancellationToken);

        if (idempotent is not null)
            return idempotent;

        if (run.Status is ArchitectureRunStatus.Committed)
        {
            if (run.GoldenManifestId is not null)
                throw new InvalidOperationException(
                    $"Run '{runId}' is already Committed but the architecture run idempotent re-load failed. Check data integrity for GoldenManifest and DecisionTrace.");

            if (!string.IsNullOrEmpty(run.CurrentManifestVersion))
                throw new InvalidOperationException("This run was committed on the legacy coordinator path. " +
                                                    "Re-commit idempotency and reads require a consistent architecture run record (GoldenManifestId / DecisionTraceId populated).");
            throw new ConflictException(
                $"Run '{runId}' is already Committed but the run record has no committed manifest version or architecture run identifiers.");
        }

        try
        {
            RunStateTransitionEnforcement.EnsureCommitAllowed(_runStateTransitionService, run, runId);
            IReadOnlyList<AgentResult> commitGateResults =
                await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);
            RunStateTransitionEnforcement.EnsureCommitReadyAgentResults(
                _runStateTransitionService,
                runId,
                commitGateResults);
        }
        catch (ConflictException ex)
        {
            await _failureRecorder.RecordFailureAsync(actor, runId, $"Commit blocked: {ex.Message}", cancellationToken);
            throw;
        }

        RunId typedRunId = new(runGuid);

        if (!ArchitectureRunStatusTransitionTable.TryIssueReadyForCommitRun(run.Status, typedRunId, out ReadyForCommitRun readyForCommitRun))
            throw new InvalidOperationException(
                $"Run '{runId}' passed commit gates but could not issue a ReadyForCommitRun finalize handle.");

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");

        PreCommitGateResult? skippedMustGate = AuthorityCommitSkippedMustGate.Evaluate(request.IntakeTransparencyTrail);

        if (skippedMustGate is not null)
        {
            throw new PreCommitGovernanceBlockedException(skippedMustGate);
        }

        AuthorityCommitDecisionMaterializationResult materialization;
        try
        {
            materialization = await _decisionMaterializationStage.MaterializeAsync(
                run,
                runGuid,
                runRecord,
                request,
                scope,
                commitOptions,
                cancellationToken);

            await _governanceStage.EvaluateOrThrowAsync(
                runId,
                actor,
                materialization.ContractWireJson,
                AuthorityCommitGovernanceStage.NormalizeGovernanceBypassJustification(commitOptions?.BypassJustification),
                new PreCommitGovernancePreloadedData
                {
                    FindingsSnapshotFindings = materialization.FindingsForFinalization.Findings,
                    ScopePolicyPackAssignments = materialization.ScopePolicyPackAssignments
                },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _failureRecorder.RecordFailureAsync(actor, runId, ex.GetType().Name, cancellationToken);
            throw;
        }

        return await _persistenceStage.FinalizeAndCompleteAsync(
            run,
            runId,
            runGuid,
            runRecord,
            request,
            actor,
            readyForCommitRun,
            materialization,
            cancellationToken);
    }
}
