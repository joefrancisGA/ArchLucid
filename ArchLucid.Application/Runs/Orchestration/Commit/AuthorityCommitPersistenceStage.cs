using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Application.Runs.Telemetry;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cm = ArchLucid.Contracts.Manifest;
using DomainRuleAuditTracePayload = ArchLucid.Decisioning.DecisionTraces.RuleAuditTracePayload;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <inheritdoc cref="IAuthorityCommitPersistenceStage" />
public sealed class AuthorityCommitPersistenceStage(
    IManifestFinalizationService manifestFinalizationService,
    IAuthorityCommitIdempotencyHandler idempotencyHandler,
    IBaselineMutationAuditService baselineMutationAudit,
    IScopeContextProvider scopeContextProvider,
    ITrialFunnelCommitHook trialFunnelCommitHook,
    IFirstSessionLifecycleHook firstSessionLifecycleHook,
    PostCommitProjectionEnqueuer postCommitProjectionEnqueuer,
    IRunRepository runRepository,
    IAgentTaskRepository taskRepository,
    IAuditService auditService,
    IRunTelemetryRepository runTelemetryRepository,
    IAuthorityCommitFailureRecorder failureRecorder,
    IOptions<GenerateIacStubsOptions> generateIacStubsOptions,
    IOptions<RerankFindingsOptions> rerankFindingsOptions,
    ILogger<AuthorityCommitPersistenceStage> logger) : IAuthorityCommitPersistenceStage
{
    private readonly IManifestFinalizationService _manifestFinalizationService =
        manifestFinalizationService ?? throw new ArgumentNullException(nameof(manifestFinalizationService));

    private readonly IAuthorityCommitIdempotencyHandler _idempotencyHandler =
        idempotencyHandler ?? throw new ArgumentNullException(nameof(idempotencyHandler));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITrialFunnelCommitHook _trialFunnelCommitHook =
        trialFunnelCommitHook ?? throw new ArgumentNullException(nameof(trialFunnelCommitHook));

    private readonly IFirstSessionLifecycleHook _firstSessionLifecycleHook =
        firstSessionLifecycleHook ?? throw new ArgumentNullException(nameof(firstSessionLifecycleHook));

    private readonly PostCommitProjectionEnqueuer _postCommitProjectionEnqueuer =
        postCommitProjectionEnqueuer ?? throw new ArgumentNullException(nameof(postCommitProjectionEnqueuer));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IRunTelemetryRepository _runTelemetryRepository =
        runTelemetryRepository ?? throw new ArgumentNullException(nameof(runTelemetryRepository));

    private readonly IAuthorityCommitFailureRecorder _failureRecorder =
        failureRecorder ?? throw new ArgumentNullException(nameof(failureRecorder));

    private readonly IOptions<GenerateIacStubsOptions> _generateIacStubsOptions =
        generateIacStubsOptions ?? throw new ArgumentNullException(nameof(generateIacStubsOptions));

    private readonly IOptions<RerankFindingsOptions> _rerankFindingsOptions =
        rerankFindingsOptions ?? throw new ArgumentNullException(nameof(rerankFindingsOptions));

    private readonly ILogger<AuthorityCommitPersistenceStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<CommitRunResult> FinalizeAndCompleteAsync(
        ArchitectureRun run,
        string runId,
        Guid runGuid,
        RunRecord runRecord,
        ArchitectureRequest request,
        string actor,
        ReadyForCommitRun readyForCommitRun,
        AuthorityCommitDecisionMaterializationResult materialization,
        CancellationToken cancellationToken)
    {
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
                    ManifestModel = materialization.ManifestModel,
                    Contract = materialization.Contract,
                    Keying = BuildSaveContractsManifestOptions(materialization.ManifestModel, materialization.Trace),
                    Trace = materialization.Trace,
                    PreloadedFindingsSnapshot = materialization.FindingsForFinalization,
                    PreloadedScopePolicyPackAssignments = materialization.ScopePolicyPackAssignments,
                    PreloadedArchitectureRequest = request,
                    SkipPersistingPipelineArtifacts = materialization.SkipPersistingPipelineArtifacts,
                    ReadyForCommitHandle = readyForCommitRun
                },
                cancellationToken);

            if (finalization.WasIdempotentReturn)
            {
                CommitRunResult? idempotentReplay = await _idempotencyHandler.TryReturnCommittedAsync(run, runId, cancellationToken);

                if (idempotentReplay is not null)
                    return idempotentReplay ??
                           throw new ConflictException($"Run '{runId}' was finalized idempotently but the committed manifest could not be reloaded.");

                ArchitectureRun? runReloaded = await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
                    _runRepository,
                    _scopeContextProvider,
                    _taskRepository,
                    runId,
                    cancellationToken);

                if (runReloaded is not null)
                    idempotentReplay = await _idempotencyHandler.TryReturnCommittedAsync(runReloaded, runId, cancellationToken);

                return idempotentReplay ??
                       throw new ConflictException($"Run '{runId}' was finalized idempotently but the committed manifest could not be reloaded.");
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _failureRecorder.RecordFailureAsync(actor, runId, $"Persist failed: {ex.GetType().Name}", cancellationToken);
            throw;
        }

        ManifestDocument persisted =
            finalization.PersistedManifest ?? throw new InvalidOperationException("Manifest finalization returned no persisted model.");
        Cm.GoldenManifest contract = materialization.Contract;
        DecisionTrace trace = materialization.Trace;

        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunCompleted,
            actor,
            runId,
            $"ManifestVersion={contract.Metadata.ManifestVersion}; SystemName={contract.SystemName}; WarningCount={persisted.Warnings.Count}; CommitPath=authority",
            cancellationToken);
        ScopeContext commitScope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset committedUtc = TimeProvider.System.GetUtcNow();
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
            int remainingActiveRuns = await _runRepository.CountActiveRunsForArchitectureRequestAsync(
                commitScope,
                run.RequestId,
                cancellationToken);

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
            _logger.LogInformation(
                "Architecture run committed (authority): RunId={RunId} ManifestVersion={Version} WarningCount={Wc}",
                LogSanitizer.Sanitize(runId),
                contract.Metadata.ManifestVersion,
                persisted.Warnings.Count);

        try
        {
            DateTime telemetryCommitUtc = TimeProvider.System.UtcNowDateTime();
            CommitRunTelemetryMetrics telemetry = CommitRunTelemetryMetrics.FromCommitContext(
                runRecord,
                materialization.EvidencePackageForTelemetry,
                materialization.AgentResultsForTelemetry,
                telemetryCommitUtc,
                persisted);
            await TryInsertRunTelemetryAsync(runGuid, telemetry, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Failed to insert RunTelemetry for RunId={RunId}", runId);
        }

        await _failureRecorder.TryPublishAzureDevOpsCommitStatusBestEffortAsync(runId, succeeded: true, cancellationToken);

        return new CommitRunResult
        {
            Manifest = contract,
            DecisionTraces = [DecisionTraceRecordMapper.ToDto(trace)],
            Warnings = persisted.Warnings.Count == 0 ? [] : [.. persisted.Warnings]
        };
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
}
