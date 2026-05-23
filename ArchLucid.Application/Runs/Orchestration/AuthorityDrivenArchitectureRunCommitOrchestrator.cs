using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Application.Runs.Telemetry;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Decisions;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cm = ArchLucid.Contracts.Manifest;
using DecisioningIdTraceRepository = ArchLucid.Decisioning.Interfaces.IDecisionTraceRepository;
using DecisioningIGoldenManifestRepository = ArchLucid.Core.Manifest.IGoldenManifestRepository;
using Dm = ArchLucid.Decisioning.Models;

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
    IAgentEvaluationService agentEvaluationService,
    IDecisionEngine decisionEngine,
    IDecisionEngineV2 decisionEngineV2,
    IDecisionNodeRepository decisionNodeRepository,
    DecisioningIdTraceRepository decisionTraceRepository,
    DecisioningIGoldenManifestRepository goldenManifestRepository,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    IManifestFinalizationService manifestFinalizationService,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IPreCommitGovernanceBlockExplainer preCommitGovernanceBlockExplainer,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    IAuditService auditService,
    ITrialFunnelCommitHook trialFunnelCommitHook,
    IFirstSessionLifecycleHook firstSessionLifecycleHook,
    ISampleRunPurgeService sampleRunPurgeService,
    IFindingIacStubGenerator findingIacStubGenerator,
    IFindingPriorityReranker findingPriorityReranker,
    IDbConnectionFactory dbConnectionFactory,
    IRunStateTransitionService runStateTransitionService,
    IOptions<GenerateIacStubsOptions> generateIacStubsOptions,
    IOptions<RerankFindingsOptions> rerankFindingsOptions,
    ArchLucid.Application.Runs.Orchestration.Events.IReviewCompletedEventHandler reviewCompletedEventHandler,
    ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator> logger) : IArchitectureRunCommitOrchestrator
{
    private const int CommitRunTransientMaxAttempts = 5;
    private const int CommitRunTransientBackoffMillisecondsPerAttempt = 25;
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultRepository _agentResultRepository = agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IAgentEvaluationService
        _agentEvaluationService = agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IDecisionEngine _decisionEngine = decisionEngine ?? throw new ArgumentNullException(nameof(decisionEngine));
    private readonly IDecisionEngineV2 _decisionEngineV2 = decisionEngineV2 ?? throw new ArgumentNullException(nameof(decisionEngineV2));

    private readonly IDecisionNodeRepository
        _decisionNodeRepository = decisionNodeRepository ?? throw new ArgumentNullException(nameof(decisionNodeRepository));

    private readonly DecisioningIdTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IFirstSessionLifecycleHook _firstSessionLifecycleHook =
        firstSessionLifecycleHook ?? throw new ArgumentNullException(nameof(firstSessionLifecycleHook));

    private readonly ISampleRunPurgeService _sampleRunPurgeService =
        sampleRunPurgeService ?? throw new ArgumentNullException(nameof(sampleRunPurgeService));

    private readonly IFindingIacStubGenerator _findingIacStubGenerator =
        findingIacStubGenerator ?? throw new ArgumentNullException(nameof(findingIacStubGenerator));

    private readonly IOptions<GenerateIacStubsOptions> _generateIacStubsOptions =
        generateIacStubsOptions ?? throw new ArgumentNullException(nameof(generateIacStubsOptions));

    private readonly IFindingPriorityReranker _findingPriorityReranker =
        findingPriorityReranker ?? throw new ArgumentNullException(nameof(findingPriorityReranker));

    private readonly IOptions<RerankFindingsOptions> _rerankFindingsOptions =
        rerankFindingsOptions ?? throw new ArgumentNullException(nameof(rerankFindingsOptions));

    private readonly ArchLucid.Application.Runs.Orchestration.Events.IReviewCompletedEventHandler _reviewCompletedEventHandler =
        reviewCompletedEventHandler ?? throw new ArgumentNullException(nameof(reviewCompletedEventHandler));

    private readonly IDbConnectionFactory _dbConnectionFactory = dbConnectionFactory ?? throw new ArgumentNullException(nameof(dbConnectionFactory));

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

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder = projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly ITrialFunnelCommitHook _trialFunnelCommitHook = trialFunnelCommitHook ?? throw new ArgumentNullException(nameof(trialFunnelCommitHook));

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
        for (int attempt = 1; attempt <= CommitRunTransientMaxAttempts; attempt++)
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
                await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, "Run not found.", cancellationToken);
                throw;
            }
            catch (Exception ex) when (SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex))
            {
                CommitRunResult? reconciled = await TryReconcileAfterConcurrentCommitAsync(runId, cancellationToken);
                if (reconciled is not null)
                    return reconciled;
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(ex,
                        "CommitRunAsync (authority) unique-key violation without reconcilable manifest (attempt {Attempt}/{Max}) for RunId={RunId}.", attempt,
                        CommitRunTransientMaxAttempts, LogSanitizer.Sanitize(runId));
                if (attempt >= CommitRunTransientMaxAttempts)
                    throw new ConflictException(
                        $"Commit for run '{runId}' raced with another commit. The manifest could not be loaded yet; retry the request.");
                await Task.Delay(TimeSpan.FromMilliseconds(CommitRunTransientBackoffMillisecondsPerAttempt * attempt), cancellationToken);
            }
            catch (Exception ex) when (SqlTransientDetector.IsTransient(ex) && attempt < CommitRunTransientMaxAttempts)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(ex, "CommitRunAsync (authority) transient database error (attempt {Attempt}/{Max}) for RunId={RunId}; retrying.",
                        attempt, CommitRunTransientMaxAttempts, LogSanitizer.Sanitize(runId));
                await Task.Delay(TimeSpan.FromMilliseconds(CommitRunTransientBackoffMillisecondsPerAttempt * attempt), cancellationToken);
            }

        throw new InvalidOperationException("CommitRunAsync (authority) exhausted transient retries without returning.");
    }

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
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(_runRepository, _scopeContextProvider, _taskRepository, runId, cancellationToken);
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
        }
        catch (ConflictException ex)
        {
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, $"Commit blocked: {ex.Message}",
                cancellationToken);
            throw;
        }

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        ManifestDocument manifestModel;
        DecisionTrace trace;
        Cm.GoldenManifest contract;
        AgentEvidencePackage? evidencePackageForTelemetry;
        IReadOnlyList<AgentResult>? agentResultsForTelemetry;
        try
        {
            evidencePackageForTelemetry = await GetEvidencePackageForCommitOrThrowAsync(runId, cancellationToken);
            if (runRecord.ContextSnapshotId is not { } contextSnapshotId || runRecord.GraphSnapshotId is not { } graphId ||
                runRecord.FindingsSnapshotId is not { } findingsId)
                throw new InvalidOperationException(
                    $"Run '{runId}' is missing architecture run pipeline snapshot ids (ContextSnapshotId, GraphSnapshotId, and FindingsSnapshotId are all required for architecture run commit).");
            GraphSnapshot? graph = await _graphSnapshotRepository.GetByIdAsync(graphId, cancellationToken);
            if (graph is null)
                throw new InvalidOperationException($"Graph snapshot '{graphId:D}' for run '{runId}' was not found.");
            agentResultsForTelemetry = await _agentResultRepository.GetByRunIdAsync(runId, cancellationToken);
            GraphSnapshot graphForDecision = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, agentResultsForTelemetry);
            Dm.FindingsSnapshot? findings = await _findingsSnapshotRepository.GetByIdAsync(findingsId, cancellationToken);
            if (findings is null)
                throw new InvalidOperationException($"Findings snapshot '{findingsId:D}' for run '{runId}' was not found.");
            (manifestModel, trace) = await _decisionEngine.DecideAsync(runGuid, contextSnapshotId, graphForDecision, findings, cancellationToken);
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
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, ex.GetType().Name, cancellationToken);
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
                    Trace = trace
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
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, $"Persist failed: {ex.GetType().Name}",
                cancellationToken);
            throw;
        }

        ManifestDocument persisted =
            finalization.PersistedManifest ?? throw new InvalidOperationException("Manifest finalization returned no persisted model.");
        await EnsureDecisionEngineV2NodesMaterializedAsync(runId, request, cancellationToken);
        await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunCompleted, actor, runId,
            $"ManifestVersion={contract.Metadata.ManifestVersion}; SystemName={contract.SystemName}; WarningCount={persisted.Warnings.Count}; CommitPath=authority",
            cancellationToken);
        ScopeContext commitScope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset committedUtc = TimeProvider.System.GetUtcNow();
        // Pins dbo.Tenants.TrialFirstManifestCommittedUtc for every tenant on first commit; trial-funnel audit/metrics stay inside the hook.
        await _trialFunnelCommitHook.OnTrialTenantManifestCommittedAsync(commitScope.TenantId, committedUtc, cancellationToken);
        await _firstSessionLifecycleHook.OnSuccessfulManifestCommitAsync(commitScope.TenantId, cancellationToken);

        if (!runRecord.IsSample)
            TryScheduleSampleRunPurgeForTenant(commitScope.TenantId);

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

        TryScheduleIacStubGeneration(runId);
        TryScheduleFindingPriorityRerank(runId);
        TryScheduleReviewCompletedEvent(runId, request.ProjectId);

        return new CommitRunResult { Manifest = contract, DecisionTraces = [trace], Warnings = persisted.Warnings.Count == 0 ? [] : [.. persisted.Warnings] };
    }

    private void TryScheduleReviewCompletedEvent(string runId, string projectId)
    {
        _ = Task.Run(
            async () =>
            {
                try
                {
                    await _reviewCompletedEventHandler.HandleAsync(new ArchLucid.Application.Runs.Orchestration.Events.ReviewCompletedEvent { RunId = runId, ProjectId = projectId }, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarningWithSanitizedUserArg(ex, "Post-commit review completed event failed for RunId={RunId}", runId);
                }
            },
            CancellationToken.None);
    }

    private void TryScheduleSampleRunPurgeForTenant(Guid tenantId)
    {
        _ = Task.Run(
            async () =>
            {
                try
                {
                    await _sampleRunPurgeService.PurgeForTenantAsync(tenantId, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarningWithSanitizedUserArg(
                        ex,
                        "Post-commit sample run purge failed for TenantId={TenantId}",
                        tenantId.ToString("D"));
                }
            },
            CancellationToken.None);
    }

    private void TryScheduleFindingPriorityRerank(string runId)
    {
        if (!_rerankFindingsOptions.Value.Enabled)
            return;

        _ = Task.Run(
            async () =>
            {
                try
                {
                    await _findingPriorityReranker.RerankForRunAsync(runId, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarningWithSanitizedUserArg(ex, "Post-commit finding priority re-rank failed for RunId={RunId}", runId);
                }
            },
            CancellationToken.None);
    }

    private void TryScheduleIacStubGeneration(string runId)
    {
        if (!_generateIacStubsOptions.Value.Enabled)
            return;

        _ = Task.Run(
            async () =>
            {
                try
                {
                    await _findingIacStubGenerator.GenerateAndPersistStubsForRunAsync(runId, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarningWithSanitizedUserArg(ex, "Post-commit IaC stub generation failed for RunId={RunId}", runId);
                }
            },
            CancellationToken.None);
    }

    private static SaveContractsManifestOptions BuildSaveContractsManifestOptions(ManifestDocument manifestModel, DecisionTrace trace)
    {
        RuleAuditTracePayload audit = trace.RequireRuleAudit();
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
            CreatedUtc = manifestModel.CreatedUtc
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
        DecisionTrace? trace = await _decisionTraceRepository.GetByIdAsync(scope, traceId, cancellationToken);
        if (trace is null)
            throw new ConflictException($"Run '{runId}' is already committed but the decision trace '{traceId:D}' could not be loaded for idempotent replay.");
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        Cm.GoldenManifest contract = await _projectionBuilder.BuildAsync(manifestModel, new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            cancellationToken);
        IReadOnlyList<string> storedGaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(contract, [trace]);
        if (storedGaps.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Committed run (authority) {RunId} has manifest/trace linkage gaps: {Gaps}", LogSanitizer.Sanitize(runId),
                    string.Join("; ", storedGaps));
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Commit run idempotent return (authority): RunId={RunId} ManifestId={ManifestId} TraceId={TraceId}",
                LogSanitizer.Sanitize(runId), goldenId.ToString("D"), traceId.ToString("D"));
        await EnsureDecisionEngineV2NodesMaterializedAsync(runId, request, cancellationToken);
        return new CommitRunResult
        {
            Manifest = contract,
            DecisionTraces = [trace],
            Warnings = manifestModel.Warnings.Count == 0 ? [] : [.. manifestModel.Warnings]
        };
    }

    /// <summary>
    ///     Persists coordinator <see cref = "IDecisionEngineV2"/> decision nodes when missing so read
    ///     <c>GET /v1/architecture/run/{runId}/decisions</c> is populated after authority commit (idempotent).
    /// </summary>
    private async Task EnsureDecisionEngineV2NodesMaterializedAsync(string runId, ArchitectureRequest request, CancellationToken cancellationToken)
    {
        IReadOnlyList<DecisionNode> existing = await _decisionNodeRepository.GetByRunIdAsync(runId, cancellationToken);
        if (existing.Count > 0)
            return;
        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(runId, cancellationToken);
        if (tasks.Count == 0)
            return;
        AgentEvidencePackage evidence = await GetEvidencePackageForCommitOrThrowAsync(runId, cancellationToken);
        IReadOnlyList<AgentResult> results = await _agentResultRepository.GetByRunIdAsync(runId, cancellationToken);
        if (results.Count == 0)
            return;
        IReadOnlyList<AgentEvaluation> evaluations = await _agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
        IReadOnlyList<DecisionNode> decisionNodes = await _decisionEngineV2.ResolveAsync(runId, request, tasks, results, evaluations, cancellationToken);
        if (decisionNodes.Count == 0)
            return;
        await _decisionNodeRepository.CreateManyAsync(decisionNodes, cancellationToken);
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
        using System.Data.IDbConnection connection = await _dbConnectionFactory.CreateOpenConnectionAsync(cancellationToken);
        const string sql = @"
                IF NOT EXISTS (SELECT 1 FROM dbo.RunTelemetry WHERE RunId = @RunId)
                INSERT INTO dbo.RunTelemetry (RunId, RequestDurationMs, AgentExecutionDurationMs, ManualReviewDurationMs, EstimatedHoursSaved)
                VALUES (@RunId, @RequestDurationMs, @AgentExecutionDurationMs, @ManualReviewDurationMs, @EstimatedHoursSaved);";
        await Dapper.SqlMapper.ExecuteAsync(connection, sql,
            new
            {
                RunId = runGuid,
                telemetry.RequestDurationMs,
                telemetry.AgentExecutionDurationMs,
                telemetry.ManualReviewDurationMs,
                telemetry.EstimatedHoursSaved
            });
    }

    private static void ApplyRuleAuditScope(DecisionTrace trace, ScopeContext scope)
    {
        RuleAuditTracePayload audit = trace.RequireRuleAudit();
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
        CancellationToken cancellationToken)
    {
        PreCommitGateResult gateResult = await _preCommitGovernanceGate.EvaluateAsync(runId, goldenManifestWireJson, cancellationToken);
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
