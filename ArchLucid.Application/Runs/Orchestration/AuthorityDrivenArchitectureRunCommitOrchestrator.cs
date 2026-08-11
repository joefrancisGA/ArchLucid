using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Telemetry;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.DecisionTraces;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;
using RuleAuditTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.RuleAuditTraceDto;
using RuleAuditTracePayload = ArchLucid.Contracts.Persistence.DecisionTraces.RuleAuditTracePayload;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Queries;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cm = ArchLucid.Contracts.Manifest;
using DecisioningIdTraceRepository = ArchLucid.Core.Persistence.Ports.IDecisionTraceRepository;
using DecisioningIGoldenManifestRepository = ArchLucid.Core.Manifest.IGoldenManifestRepository;
using Dm = ArchLucid.Decisioning.Models;
using DomainRuleAuditTracePayload = ArchLucid.Decisioning.DecisionTraces.RuleAuditTracePayload;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref = "IArchitectureRunCommitOrchestrator"/>
public sealed class AuthorityDrivenArchitectureRunCommitOrchestrator(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IArchitectureRequestRepository requestRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository agentResultRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionEngine decisionEngine,
    ICommitPipelineManifestReuseService commitPipelineManifestReuseService,
    DecisioningIdTraceRepository decisionTraceRepository,
    DecisioningIGoldenManifestRepository goldenManifestRepository,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    IManifestFinalizationService manifestFinalizationService,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IPreCommitGovernanceBlockExplainer preCommitGovernanceBlockExplainer,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    IAuditService auditService,
    ITrialFunnelCommitHook trialFunnelCommitHook,
    IFirstSessionLifecycleHook firstSessionLifecycleHook,
    PostCommitProjectionEnqueuer postCommitProjectionEnqueuer,
    IRunTelemetryRepository runTelemetryRepository,
    IRunStateTransitionService runStateTransitionService,
    IOptions<GenerateIacStubsOptions> generateIacStubsOptions,
    IOptions<RerankFindingsOptions> rerankFindingsOptions,
    IOptions<ExplainGovernanceBlocksOptions> explainGovernanceBlocksOptions,
    IAzureDevOpsCommitStatusPublisher azureDevOpsCommitStatusPublisher,
    ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator> logger) : IArchitectureRunCommitOrchestrator
{
    /// <summary>
    ///     Hard wall-clock ceiling on cumulative time spent retrying either transient SQL errors or unresolved
    ///     unique-key races inside a single <see cref="CommitRunAsync(string,CommitRunRequest?,CancellationToken)"/>
    ///     call. Each of the <see cref="CommitRunTransientRetryPolicy.MaxAttempts"/> attempts re-runs the full commit pipeline
    ///     (evidence/graph/findings reload, decision engine, governance gate, SQL finalize transaction), so bounding
    ///     by attempt count alone is not enough: <see cref="SqlTransientDetector"/> treats a plain SQL command
    ///     timeout (error -2) as retriable, and a contended/wedged resource lets each attempt burn up to the
    ///     ADO.NET default 30s command timeout; a concurrent-commit race can likewise cost several seconds of full
    ///     pipeline work per attempt. Either failure mode can compound into minutes of silent server-side hang
    ///     before the caller ever sees a response. Bounding the retry budget guarantees commit always returns —
    ///     success, or a fast 409 that the existing client-side retry loop (`commitRun` in `live-api-client.ts`)
    ///     already handles — well inside the smallest live E2E test timeout.
    /// </summary>
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultRepository _agentResultRepository = agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly ICommitPipelineManifestReuseService _commitPipelineManifestReuseService =
        commitPipelineManifestReuseService ?? throw new ArgumentNullException(nameof(commitPipelineManifestReuseService));

    private readonly IDecisionEngine _decisionEngine = decisionEngine ?? throw new ArgumentNullException(nameof(decisionEngine));

    private readonly DecisioningIdTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IFirstSessionLifecycleHook _firstSessionLifecycleHook =
        firstSessionLifecycleHook ?? throw new ArgumentNullException(nameof(firstSessionLifecycleHook));

    private readonly PostCommitProjectionEnqueuer _postCommitProjectionEnqueuer =
        postCommitProjectionEnqueuer ?? throw new ArgumentNullException(nameof(postCommitProjectionEnqueuer));

    private readonly IOptions<GenerateIacStubsOptions> _generateIacStubsOptions =
        generateIacStubsOptions ?? throw new ArgumentNullException(nameof(generateIacStubsOptions));

    private readonly IOptions<RerankFindingsOptions> _rerankFindingsOptions =
        rerankFindingsOptions ?? throw new ArgumentNullException(nameof(rerankFindingsOptions));

    private readonly IOptions<ExplainGovernanceBlocksOptions> _explainGovernanceBlocksOptions =
        explainGovernanceBlocksOptions ?? throw new ArgumentNullException(nameof(explainGovernanceBlocksOptions));

    private readonly IRunTelemetryRepository _runTelemetryRepository =
        runTelemetryRepository ?? throw new ArgumentNullException(nameof(runTelemetryRepository));

    private readonly DecisioningIGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IManifestFinalizationService _manifestFinalizationService =
        manifestFinalizationService ?? throw new ArgumentNullException(nameof(manifestFinalizationService));

    private readonly IPreCommitGovernanceGate _preCommitGovernanceGate =
        preCommitGovernanceGate ?? throw new ArgumentNullException(nameof(preCommitGovernanceGate));

    private readonly IPreCommitGovernanceBlockExplainer _preCommitGovernanceBlockExplainer =
        preCommitGovernanceBlockExplainer ?? throw new ArgumentNullException(nameof(preCommitGovernanceBlockExplainer));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder = projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly ITrialFunnelCommitHook _trialFunnelCommitHook = trialFunnelCommitHook ?? throw new ArgumentNullException(nameof(trialFunnelCommitHook));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IAzureDevOpsCommitStatusPublisher _azureDevOpsCommitStatusPublisher =
        azureDevOpsCommitStatusPublisher ?? throw new ArgumentNullException(nameof(azureDevOpsCommitStatusPublisher));

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
                await RecordCommitFailureAsync(actor, runId, "Run not found.", cancellationToken);
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

    /// <summary>
    ///     True once either the attempt count or the shared <see cref="CommitRunTransientRetryPolicy.RetryBudget"/> wall-clock
    ///     ceiling is exhausted, for either the unique-key-violation or transient-SQL retry paths in
    ///     <see cref="CommitRunAsync(string,CommitRunRequest?,CancellationToken)"/>.
    /// </summary>
    private static bool IsCommitRetryBudgetExhausted(int attempt, Stopwatch commitRetryStopwatch) =>
        CommitRunTransientRetryPolicy.IsExhausted(attempt, commitRetryStopwatch.Elapsed);

    private async Task<CommitRunResult?> TryReconcileAfterConcurrentCommitAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRun? runAgain =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(_runRepository, _scopeContextProvider, _taskRepository, runId, cancellationToken);

        if (runAgain is null)
            return null;
        return await TryReturnAuthorityCommittedIdempotentAsync(runAgain, runId, cancellationToken);
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
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunFromRecordAsync(_scopeContextProvider, _taskRepository, runId, runRecord,
                cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);
        CommitRunResult? idempotent = await TryReturnAuthorityCommittedIdempotentAsync(run, runId, cancellationToken);

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
            await RecordCommitFailureAsync(actor, runId, $"Commit blocked: {ex.Message}", cancellationToken);
            throw;
        }

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        ManifestDocument manifestModel;
        DecisionTraceDto traceDto;
        DecisionTrace trace;
        Cm.GoldenManifest contract;
        AgentEvidencePackage? evidencePackageForTelemetry;
        IReadOnlyList<AgentResult>? agentResultsForTelemetry;
        FindingsSnapshot? findingsForFinalization;
        IReadOnlyList<PolicyPackAssignment>? scopePolicyPackAssignments;
        bool skipPersistingPipelineArtifacts = false;
        try
        {
            if (runRecord.ContextSnapshotId is not { } contextSnapshotId || runRecord.GraphSnapshotId is not { } graphId ||
                runRecord.FindingsSnapshotId is not { } findingsId)
                throw new InvalidOperationException(
                    $"Run '{runId}' is missing architecture run pipeline snapshot ids (ContextSnapshotId, GraphSnapshotId, and FindingsSnapshotId are all required for architecture run commit).");

            Task<AgentEvidencePackage> evidenceTask = GetEvidencePackageForCommitOrThrowAsync(runId, cancellationToken);
            Task<GraphSnapshot?> graphTask = _graphSnapshotRepository.GetByIdAsync(scope, graphId, cancellationToken);
            Task<IReadOnlyList<AgentResult>> agentResultsTask =
                _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);
            Task<FindingsSnapshot?> findingsTask = _findingsSnapshotRepository.GetByIdAsync(scope, findingsId, cancellationToken);
            Task<IReadOnlyList<PolicyPackAssignment>> scopeAssignmentsTask =
                _policyPackAssignmentRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

            await Task.WhenAll(evidenceTask, graphTask, agentResultsTask, findingsTask, scopeAssignmentsTask);

            evidencePackageForTelemetry = await evidenceTask;
            GraphSnapshot? graph = await graphTask;

            if (graph is null)
                throw new InvalidOperationException($"Graph snapshot '{graphId:D}' for run '{runId}' was not found.");

            agentResultsForTelemetry = await agentResultsTask;
            GraphSnapshot graphForDecision = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, agentResultsForTelemetry);
            FindingsSnapshot? findings = await findingsTask;
            scopePolicyPackAssignments = await scopeAssignmentsTask;
            findingsForFinalization = findings;

            if (findings is null)
                throw new InvalidOperationException($"Findings snapshot '{findingsId:D}' for run '{runId}' was not found.");
            CommitPipelineManifestReuseResult? reusedManifest = await _commitPipelineManifestReuseService.TryReusePipelineManifestAsync(
                run,
                runGuid,
                contextSnapshotId,
                graph,
                graphForDecision,
                findings,
                scope,
                cancellationToken);

            if (reusedManifest is not null)
            {
                manifestModel = reusedManifest.Manifest;
                traceDto = reusedManifest.TraceDto;
                skipPersistingPipelineArtifacts = true;
            }
            else
            {
                (manifestModel, traceDto) = await _decisionEngine.DecideAsync(runGuid, contextSnapshotId, graphForDecision, findings, cancellationToken);
            }

            trace = DecisionTraceRecordMapper.ToDomain(traceDto);
            ApplyRuleAuditScope(trace, scope);
            ApplyAuthorityManifestScope(manifestModel, scope);
            contract = await _projectionBuilder.BuildAsync(manifestModel, new AuthorityCommitProjectionInput { SystemName = request.SystemName },
                cancellationToken);
            AlignAuthorityVersionToContract(manifestModel, contract);
            IReadOnlyList<string> traceabilityGaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(contract, [trace]);

            if (traceabilityGaps.Count > 0)
                throw new InvalidOperationException("Committed manifest traceability (authority) invariant failed: " + string.Join("; ", traceabilityGaps));
            string contractWireJson = JsonSerializer.Serialize(contract, ContractJson.Default);
            await EvaluatePreCommitGovernanceGateOrThrowAsync(
                runId,
                actor,
                contractWireJson,
                NormalizeGovernanceBypassJustification(commitOptions?.BypassJustification),
                new PreCommitGovernancePreloadedData
                {
                    FindingsSnapshotFindings = findings.Findings,
                    ScopePolicyPackAssignments = scopePolicyPackAssignments
                },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await RecordCommitFailureAsync(actor, runId, ex.GetType().Name, cancellationToken);
            throw;
        }

        ManifestFinalizationResult finalization;
        try
        {
            finalization = await _manifestFinalizationService.FinalizeAsync(
                new ManifestFinalizationRequest
                {
                    RunId = runGuid,
                    ExpectedFindingsSnapshotId = runRecord.FindingsSnapshotId!.Value,
                    ExpectedArtifactBundleId = runRecord.ArtifactBundleId,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    CorrelationId = null,
                    ManifestModel = manifestModel,
                    Contract = contract,
                    Keying = BuildSaveContractsManifestOptions(manifestModel, trace),
                    Trace = trace,
                    PreloadedFindingsSnapshot = findingsForFinalization,
                    PreloadedScopePolicyPackAssignments = scopePolicyPackAssignments,
                    SkipPersistingPipelineArtifacts = skipPersistingPipelineArtifacts
                }, cancellationToken);

            if (finalization.WasIdempotentReturn)
            {
                CommitRunResult? idempotentReplay = await TryReturnAuthorityCommittedIdempotentAsync(run, runId, cancellationToken);

                if (idempotentReplay is not null)
                    return idempotentReplay ??
                           throw new ConflictException($"Run '{runId}' was finalized idempotently but the committed manifest could not be reloaded.");

                ArchitectureRun? runReloaded = await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(_runRepository, _scopeContextProvider,
                    _taskRepository, runId, cancellationToken);

                if (runReloaded is not null)
                    idempotentReplay = await TryReturnAuthorityCommittedIdempotentAsync(runReloaded, runId, cancellationToken);

                return idempotentReplay ?? throw new ConflictException($"Run '{runId}' was finalized idempotently but the committed manifest could not be reloaded.");
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await RecordCommitFailureAsync(actor, runId, $"Persist failed: {ex.GetType().Name}", cancellationToken);
            throw;
        }

        ManifestDocument persisted =
            finalization.PersistedManifest ?? throw new InvalidOperationException("Manifest finalization returned no persisted model.");
        await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunCompleted, actor, runId,
            $"ManifestVersion={contract.Metadata.ManifestVersion}; SystemName={contract.SystemName}; WarningCount={persisted.Warnings.Count}; CommitPath=authority",
            cancellationToken);
        ScopeContext commitScope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset committedUtc = TimeProvider.System.GetUtcNow();
        // Pins dbo.Tenants.TrialFirstManifestCommittedUtc for every tenant on first commit; trial-funnel audit/metrics stay inside the hook.
        await _trialFunnelCommitHook.OnTrialTenantManifestCommittedAsync(commitScope.TenantId, committedUtc, cancellationToken);
        await _firstSessionLifecycleHook.OnSuccessfulManifestCommitAsync(commitScope.TenantId, cancellationToken);
        WizardPilotCommitTelemetry.RecordIfWizardSourced(request, runRecord, committedUtc.UtcDateTime);

        await _postCommitProjectionEnqueuer.EnqueueAfterCommitAsync(
            runGuid,
            commitScope,
            enqueueSampleRunPurge: !runRecord.IsSample,
            enqueueFindingPriorityRerank: _rerankFindingsOptions.Value.Enabled,
            enqueueIacStubGeneration: _generateIacStubsOptions.Value.Enabled,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(run.RequestId))
        {
            int remainingActiveRuns = await _runRepository.CountActiveRunsForArchitectureRequestAsync(commitScope, run.RequestId, cancellationToken);

            if (remainingActiveRuns == 0)
            {
                AuditEvent requestReleased = commitScope.CreateAuditEvent(
                    AuditEventTypes.RequestReleased,
                    actor,
                    actor,
                    JsonSerializer.Serialize(
                        new
                        {
                            architectureRequestId = run.RequestId,
                            remainingActiveRunsAfterCommit = remainingActiveRuns,
                            trigger = "commit"
                        },
                        AuditJsonSerializationOptions.Instance));
                requestReleased.RunId = runGuid;

                await _auditService.LogAsync(requestReleased, cancellationToken);
            }
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Architecture run committed (authority): RunId={RunId} ManifestVersion={Version} WarningCount={Wc}",
                LogSanitizer.Sanitize(runId), contract.Metadata.ManifestVersion, persisted.Warnings.Count);
        try
        {
            DateTime telemetryCommitUtc = TimeProvider.System.UtcNowDateTime();
            CommitRunTelemetryMetrics telemetry = CommitRunTelemetryMetrics.FromCommitContext(runRecord, evidencePackageForTelemetry, agentResultsForTelemetry,
                telemetryCommitUtc, persisted);
            await TryInsertRunTelemetryAsync(runGuid, telemetry, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Failed to insert RunTelemetry for RunId={RunId}", runId);
        }

        await TryPublishAzureDevOpsCommitStatusBestEffortAsync(runId, succeeded: true, cancellationToken);

        return new CommitRunResult { Manifest = contract, DecisionTraces = [DecisionTraceRecordMapper.ToDto(trace)], Warnings = persisted.Warnings.Count == 0 ? [] : [.. persisted.Warnings] };
    }

    private async Task RecordCommitFailureAsync(
        string actor,
        string runId,
        string auditDetails,
        CancellationToken cancellationToken)
    {
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            auditDetails,
            cancellationToken);
        await TryPublishAzureDevOpsCommitStatusBestEffortAsync(runId, succeeded: false, cancellationToken);
    }

    private async Task TryPublishAzureDevOpsCommitStatusBestEffortAsync(
        string runId,
        bool succeeded,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
            return;

        try
        {
            await _azureDevOpsCommitStatusPublisher
                .PublishCommitOutcomeAsync(runGuid, succeeded, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Azure DevOps commit status publish failed for RunId={RunId} (Succeeded={Succeeded}).",
                    LogSanitizer.Sanitize(runId),
                    succeeded);
            }
        }
    }

    private static SaveContractsManifestOptions BuildSaveContractsManifestOptions(ManifestDocument manifestModel, DecisionTrace trace)
    {
        DomainRuleAuditTracePayload audit = trace.RequireRuleAudit();
        return new SaveContractsManifestOptions
        {
            ManifestId = manifestModel.ManifestId,
            RunId = manifestModel.RunId,
            ContextSnapshotId = manifestModel.ContextSnapshotId,
            GraphSnapshotId = manifestModel.GraphSnapshotId,
            FindingsSnapshotId = manifestModel.FindingsSnapshotId,
            DecisionTraceId = audit.DecisionTraceId,
            RuleSetId = manifestModel.RuleSetId,
            RuleSetVersion = manifestModel.RuleSetVersion,
            RuleSetHash = manifestModel.RuleSetHash,
            CreatedUtc = manifestModel.CreatedUtc,
            PrecomputedManifestHash = manifestModel.ManifestHash
        };
    }

    private async Task<CommitRunResult?> TryReturnAuthorityCommittedIdempotentAsync(ArchitectureRun run, string runId, CancellationToken cancellationToken)
    {
        if (run.Status is not ArchitectureRunStatus.Committed)
            return null;

        if (run.GoldenManifestId is not { } goldenId)
            return null;

        if (run.DecisionTraceId is not { } traceId)
            throw new ConflictException($"Run '{runId}' is already committed (architecture run) but DecisionTraceId is missing on the run record.");
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ManifestDocument? manifestModel = await _goldenManifestRepository.GetByIdAsync(scope, goldenId, cancellationToken);

        if (manifestModel is null)
            throw new ConflictException(
                $"Run '{runId}' is already committed but the golden manifest '{goldenId:D}' could not be loaded for idempotent replay.");
        DecisionTraceDto? traceDto = await _decisionTraceRepository.GetByIdAsync(scope, traceId, cancellationToken);

        if (traceDto is null)
            throw new ConflictException($"Run '{runId}' is already committed but the decision trace '{traceId:D}' could not be loaded for idempotent replay.");
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        Cm.GoldenManifest contract = await _projectionBuilder.BuildAsync(manifestModel, new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            cancellationToken);
        IReadOnlyList<string> storedGaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(contract, [DecisionTraceRecordMapper.ToDomain(traceDto)]);

        if (storedGaps.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Committed run (authority) {RunId} has manifest/trace linkage gaps: {Gaps}", LogSanitizer.Sanitize(runId),
                    string.Join("; ", storedGaps));
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Commit run idempotent return (authority): RunId={RunId} ManifestId={ManifestId} TraceId={TraceId}",
                LogSanitizer.Sanitize(runId), goldenId.ToString("D"), traceId.ToString("D"));

        if (Guid.TryParseExact(runId, "N", out Guid runGuid) || Guid.TryParse(runId, out runGuid))
        {
            await _postCommitProjectionEnqueuer.EnqueueDecisionEngineV2NodeMaterializationAsync(runGuid, scope, cancellationToken);
        }

        return new CommitRunResult
        {
            Manifest = contract,
            DecisionTraces = [traceDto],
            Warnings = manifestModel.Warnings.Count == 0 ? [] : [.. manifestModel.Warnings]
        };
    }

    private async Task<AgentEvidencePackage> GetEvidencePackageForCommitOrThrowAsync(string runId, CancellationToken cancellationToken)
    {
        // ADR 0030 PR A3 (2026-04-24): missing evidence package = run hasn't been executed yet,
        // which is a conflict with the current run state, not a malformed request → 409 (not 400).
        return await _agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken) ??
               throw new ConflictException($"Run '{runId}' cannot be committed: no evidence package exists. Execute the run first.");
    }

    private async Task TryInsertRunTelemetryAsync(Guid runGuid, CommitRunTelemetryMetrics telemetry, CancellationToken cancellationToken)
    {
        RunCommitTelemetryWriteRequest request = new(
            runGuid,
            telemetry.RequestDurationMs,
            telemetry.AgentExecutionDurationMs,
            telemetry.ManualReviewDurationMs,
            telemetry.EstimatedHoursSaved);

        await _runTelemetryRepository.InsertCommitMetricsIfAbsentAsync(request, cancellationToken);
    }

    private static void ApplyRuleAuditScope(DecisionTrace trace, ScopeContext scope)
    {
        DomainRuleAuditTracePayload audit = trace.RequireRuleAudit();
        audit.TenantId = scope.TenantId;
        audit.WorkspaceId = scope.WorkspaceId;
        audit.ProjectId = scope.ProjectId;
    }

    private static void ApplyAuthorityManifestScope(ManifestDocument manifest, ScopeContext scope)
    {
        manifest.TenantId = scope.TenantId;
        manifest.WorkspaceId = scope.WorkspaceId;
        manifest.ProjectId = scope.ProjectId;
    }

    /// <summary>
    ///     ADR 0030 PR A3 (2026-04-24) — the authority engine stores <c>Metadata.Version</c> as a
    ///     bare semver (e.g. <c>1.0.0</c>), while the projection builder maps it into the contract
    ///     as a <c>v</c>-prefixed version (e.g. <c>v1.0.0</c>). The contract value is what the API
    ///     returns to clients and what subsequent <c>GET /v1/architecture/manifest/{manifestVersion}</c>
    ///     lookups compare against (ordinal exact match on <c>Metadata.Version</c> via
    ///     <c>GetByContractManifestVersionAsync</c>). Without this alignment the persisted row would
    ///     never match the version the client just received → 404. Copying the contract version onto
    ///     the authority row before persistence keeps the read path round-tripping.
    /// </summary>
    internal static void AlignAuthorityVersionToContract(ManifestDocument manifestModel, Cm.GoldenManifest contract)
    {
        if (manifestModel is null)
            throw new ArgumentNullException(nameof(manifestModel));

        if (contract is null)
            throw new ArgumentNullException(nameof(contract));

        if (string.IsNullOrWhiteSpace(contract.Metadata.ManifestVersion))
            return;
        manifestModel.Metadata.Version = contract.Metadata.ManifestVersion;
    }

    internal async Task EvaluatePreCommitGovernanceGateOrThrowAsync(
        string runId,
        string actor,
        string goldenManifestWireJson,
        string? governanceBypassJustification,
        PreCommitGovernancePreloadedData? preloadedData,
        CancellationToken cancellationToken)
    {
        PreCommitGateResult gateResult = await _preCommitGovernanceGate.EvaluateAsync(runId, goldenManifestWireJson, preloadedData, cancellationToken);

        if (gateResult.WarnOnly)
        {
            await EmitPreCommitWarnedAuditAsync(gateResult, runId, actor, cancellationToken);
            return;
        }

        if (!gateResult.Blocked)
            return;

        if (!string.IsNullOrEmpty(governanceBypassJustification))
        {
            await EmitGovernanceBypassInvokedAuditAsync(gateResult, runId, actor, governanceBypassJustification, cancellationToken);

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Pre-commit governance gate bypassed with operator justification — RunId={RunId}",
                    LogSanitizer.Sanitize(runId));
            }

            return;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            reason = gateResult.Reason,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString()
        });
        AuditEvent preCommitBlocked = scope.CreateAuditEvent(
            AuditEventTypes.GovernancePreCommitBlocked,
            actor,
            actor,
            dataJson);
        preCommitBlocked.RunId = runGuid;

        await _auditService.LogAsync(preCommitBlocked, cancellationToken);
        PreCommitGateResult resultWithExplanation = await TryAttachGovernanceBlockExplanationAsync(
            runId,
            gateResult,
            goldenManifestWireJson,
            cancellationToken);
        throw new PreCommitGovernanceBlockedException(resultWithExplanation);
    }

    private async Task<PreCommitGateResult> TryAttachGovernanceBlockExplanationAsync(
        string runId,
        PreCommitGateResult gateResult,
        string goldenManifestWireJson,
        CancellationToken cancellationToken)
    {
        if (!_explainGovernanceBlocksOptions.Value.Enabled)
            return gateResult;

        string manifestExcerpt = TruncateForGovernanceExplanation(goldenManifestWireJson);

        if (manifestExcerpt.Length == 0)
            return gateResult;

        try
        {
            string? explanation = await _preCommitGovernanceBlockExplainer.ExplainAsync(gateResult, manifestExcerpt, cancellationToken);

            if (string.IsNullOrWhiteSpace(explanation))
                return gateResult;

            return new PreCommitGateResult
            {
                Blocked = gateResult.Blocked,
                Reason = gateResult.Reason,
                BlockingFindingIds = gateResult.BlockingFindingIds,
                PolicyPackId = gateResult.PolicyPackId,
                MinimumBlockingSeverity = gateResult.MinimumBlockingSeverity,
                WarnOnly = gateResult.WarnOnly,
                Warnings = gateResult.Warnings,
                BlockExplanation = explanation
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Failed to generate governance block explanation for RunId={RunId}", runId);
            return gateResult;
        }
    }

    private static string TruncateForGovernanceExplanation(string manifestJson)
    {
        if (string.IsNullOrWhiteSpace(manifestJson))
            return string.Empty;

        const int maxLength = 4000;
        return manifestJson.Length <= maxLength
            ? manifestJson
            : manifestJson[..maxLength];
    }

    private static string? NormalizeGovernanceBypassJustification(string? raw)
    {
        if (raw is null)
            return null;

        string trimmed = raw.Trim();

        if (trimmed.Length == 0)
            return null;

        const int maxLen = 4000;

        if (trimmed.Length <= maxLen)
            return trimmed;

        return trimmed[..maxLen];
    }

    private async Task EmitGovernanceBypassInvokedAuditAsync(
        PreCommitGateResult gateResult,
        string runId,
        string actor,
        string justification,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            justification,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString(),
            gateReason = gateResult.Reason
        });
        AuditEvent bypass = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceBypassInvoked,
            actor,
            actor,
            dataJson);
        bypass.RunId = runGuid;

        await _auditService.LogAsync(bypass, cancellationToken);
    }

    private async Task EmitPreCommitWarnedAuditAsync(PreCommitGateResult gateResult, string runId, string actor, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            reason = gateResult.Reason,
            warnings = gateResult.Warnings,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString()
        });
        AuditEvent preCommitWarned = scope.CreateAuditEvent(
            AuditEventTypes.GovernancePreCommitWarned,
            actor,
            actor,
            dataJson);
        preCommitWarned.RunId = runGuid;

        await _auditService.LogAsync(preCommitWarned, cancellationToken);

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("Pre-commit governance gate warned (not blocked) — authority path: RunId={RunId}, Reason={Reason}", LogSanitizer.Sanitize(runId),
                LogSanitizer.Sanitize(gateResult.Reason ?? string.Empty));
    }
}
