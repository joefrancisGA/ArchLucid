using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Decisioning.Manifest;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Serialization;
using ArchLucid.KnowledgeGraph.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Default pipeline executor with one OpenTelemetry span per major stage (<c>authority.*</c> activity names),
///     explicitly parented to <see cref="AuthorityPipelineContext.RunActivity" /> when present.
/// </summary>
public sealed class AuthorityPipelineStagesExecutor(
    IRunRepository runRepository,
    IContextIngestionService contextIngestionService,
    IContextSnapshotRepository contextSnapshotRepository,
    IKnowledgeGraphService knowledgeGraphService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IGraphSnapshotSqlAuthorityWriter graphSnapshotSqlAuthorityWriter,
    ICosmosGraphSnapshotOutboxRepository cosmosGraphSnapshotOutboxRepository,
    IFindingsOrchestrator findingsOrchestrator,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionEngine decisionEngine,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactSynthesisService artifactSynthesisService,
    IArtifactBundleRepository artifactBundleRepository,
    ITechnologyLedgerRepository technologyLedgerRepository,
    IAuditService auditService,
    IOptionsMonitor<CosmosDbOptions> cosmosDbOptionsMonitor,
    IOptionsMonitor<AuthorityPipelineOptions> authorityPipelineOptions,
    IFindingsSnapshotEvaluationConfidenceEnricher findingsSnapshotEvaluationConfidenceEnricher,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAuthorityClosedLoopStrengtheningPass closedLoopStrengtheningPass,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    ILogger<AuthorityPipelineStagesExecutor> logger,
    IArchitectureIntelligencePersistence? architectureIntelligencePersistence = null,
    IArchitectureKnowledgeModelGraphProjector? knowledgeModelGraphProjector = null,
    IArchitectureIntelligenceAuthorityFindingsContributor? authorityFindingsContributor = null,
    TimeProvider? timeProvider = null) : IAuthorityPipelineStagesExecutor
{
    private readonly AuthorityPipelineStageContextHydrator _stageContextHydrator =
        new(
            contextSnapshotRepository,
            graphSnapshotRepository,
            findingsSnapshotRepository,
            decisionTraceRepository,
            goldenManifestRepository,
            artifactBundleRepository);

    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));

    private readonly IArtifactSynthesisService _artifactSynthesisService =
        artifactSynthesisService ?? throw new ArgumentNullException(nameof(artifactSynthesisService));

    private readonly IOptionsMonitor<AuthorityPipelineOptions> _authorityPipelineOptions =
        authorityPipelineOptions ?? throw new ArgumentNullException(nameof(authorityPipelineOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IContextIngestionService _contextIngestionService =
        contextIngestionService ?? throw new ArgumentNullException(nameof(contextIngestionService));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IOptionsMonitor<CosmosDbOptions> _cosmosDbOptionsMonitor =
        cosmosDbOptionsMonitor ?? throw new ArgumentNullException(nameof(cosmosDbOptionsMonitor));

    private readonly IDecisionEngine _decisionEngine =
        decisionEngine ?? throw new ArgumentNullException(nameof(decisionEngine));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IFindingsOrchestrator _findingsOrchestrator =
        findingsOrchestrator ?? throw new ArgumentNullException(nameof(findingsOrchestrator));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IFindingsSnapshotEvaluationConfidenceEnricher _findingsSnapshotEvaluationConfidenceEnricher =
        findingsSnapshotEvaluationConfidenceEnricher ??
        throw new ArgumentNullException(nameof(findingsSnapshotEvaluationConfidenceEnricher));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IGraphSnapshotSqlAuthorityWriter _graphSnapshotSqlAuthorityWriter =
        graphSnapshotSqlAuthorityWriter ?? throw new ArgumentNullException(nameof(graphSnapshotSqlAuthorityWriter));

    private readonly ICosmosGraphSnapshotOutboxRepository _cosmosGraphSnapshotOutboxRepository =
        cosmosGraphSnapshotOutboxRepository ?? throw new ArgumentNullException(nameof(cosmosGraphSnapshotOutboxRepository));

    private readonly IKnowledgeGraphService _knowledgeGraphService =
        knowledgeGraphService ?? throw new ArgumentNullException(nameof(knowledgeGraphService));

    private readonly ILogger<AuthorityPipelineStagesExecutor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAuthorityClosedLoopStrengtheningPass _closedLoopStrengtheningPass =
        closedLoopStrengtheningPass ?? throw new ArgumentNullException(nameof(closedLoopStrengtheningPass));

    private readonly IArchitectureIntelligencePersistence? _architectureIntelligencePersistence =
        architectureIntelligencePersistence;

    private readonly IArchitectureKnowledgeModelGraphProjector? _knowledgeModelGraphProjector =
        knowledgeModelGraphProjector;

    private readonly IArchitectureIntelligenceAuthorityFindingsContributor? _authorityFindingsContributor =
        authorityFindingsContributor;

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    private static readonly string[] PipelineStageSequence = AuthorityPipelineStageNames.Sequence;

    /// <inheritdoc />
    public async Task ExecuteAfterRunPersistedAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(ctx);
        IArchLucidUnitOfWork uow = ctx.UnitOfWork;
        RunRecord run = ctx.Run;
        ScopeContext scope = ctx.Scope;

        await ExecuteStageAsync(ctx, "authority.context_ingestion", "context_ingestion", async (_, token) =>
        {
            ctx.PriorCommittedContext ??= await _contextSnapshotRepository.GetLatestAsync(ctx.Request.ProjectId, token);

            ContextSnapshot contextSnapshot = await _contextIngestionService.IngestAsync(ctx.Request, token);
            await SaveContextAsync(contextSnapshot, uow, token);
            ctx.ContextSnapshot = contextSnapshot;

            run.ContextSnapshotId = contextSnapshot.SnapshotId;
            await UpdateRunAsync(run, uow, token);
        }, ct);

        await ExecuteStageAsync(ctx, "authority.graph", "graph", async (_, token) =>
        {
            GraphSnapshotResolutionResult? committedReuse = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
                ctx.Scope,
                run.RunId,
                run.GraphSnapshotId,
                ctx.ContextSnapshot!.SnapshotId,
                _graphSnapshotRepository,
                token);

            if (committedReuse is not null)
            {
                ctx.GraphResolution = committedReuse;
                ctx.GraphSnapshot = committedReuse.Snapshot;

                if (_logger.IsEnabled(LogLevel.Information))

                    _logger.LogInformation(
                        "Authority pipeline graph reused: RunId={RunId}, GraphResolutionMode={GraphResolutionMode}, GraphSnapshotId={GraphSnapshotId}",
                        run.RunId,
                        committedReuse.ResolutionMode,
                        committedReuse.Snapshot.GraphSnapshotId);


                if (run.GraphSnapshotId != committedReuse.Snapshot.GraphSnapshotId)
                {
                    run.GraphSnapshotId = committedReuse.Snapshot.GraphSnapshotId;
                    await UpdateRunAsync(run, uow, token);
                }

                return;
            }

            ArchitectureKnowledgeModel? knowledgeModel = await TryLoadKnowledgeModelAsync(ctx.Scope, run.RunId, token);
            ArchitectureKnowledgeModel? priorKnowledgeModel = null;

            if (ctx.PriorCommittedContext is not null)
            {
                priorKnowledgeModel = await TryLoadKnowledgeModelAsync(
                    ctx.Scope,
                    ctx.PriorCommittedContext.RunId,
                    token);
            }

            GraphSnapshotResolutionResult graphResolution;

            if (knowledgeModel is not null && _knowledgeModelGraphProjector is not null)
            {
                graphResolution = await KnowledgeModelAwareGraphSnapshotResolver.ResolveAsync(
                    ctx.Scope,
                    ctx.PriorCommittedContext,
                    ctx.ContextSnapshot!,
                    run.RunId,
                    knowledgeModel,
                    priorKnowledgeModel,
                    _knowledgeGraphService,
                    _knowledgeModelGraphProjector,
                    _graphSnapshotRepository,
                    token);
            }
            else
            {
                graphResolution = await GraphSnapshotReuseEvaluator.ResolveAsync(
                    ctx.Scope,
                    ctx.PriorCommittedContext,
                    ctx.ContextSnapshot!,
                    run.RunId,
                    _knowledgeGraphService,
                    _graphSnapshotRepository,
                    token,
                    priorKnowledgeModel,
                    knowledgeModel);
            }

            ctx.GraphResolution = graphResolution;
            GraphSnapshot graphSnapshot = graphResolution.Snapshot;
            ctx.GraphSnapshot = graphSnapshot;

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation(
                    "Authority pipeline graph resolved: RunId={RunId}, GraphResolutionMode={GraphResolutionMode}, GraphSnapshotId={GraphSnapshotId}",
                    run.RunId,
                    graphResolution.ResolutionMode,
                    graphSnapshot.GraphSnapshotId);


            await SaveGraphAsync(graphSnapshot, ctx.Scope, uow, token);

            run.GraphSnapshotId = graphSnapshot.GraphSnapshotId;
            await UpdateRunAsync(run, uow, token);
        }, ct);

        await ExecuteStageAsync(ctx, "authority.findings", "findings", async (_, token) =>
        {
            FindingsSnapshot findingsSnapshot = await _findingsOrchestrator.GenerateFindingsSnapshotAsync(
                run.RunId,
                ctx.ContextSnapshot!.SnapshotId,
                ctx.GraphSnapshot!,
                token);

            if (_authorityFindingsContributor is not null)
            {
                IReadOnlyList<Finding> contributedFindings = await _authorityFindingsContributor
                    .ContributeAsync(scope, run.RunId.ToString("D"), token)
                    .ConfigureAwait(false);

                FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                    findingsSnapshot,
                    contributedFindings,
                    _timeProvider);
            }

            try
            {
                await _findingsSnapshotEvaluationConfidenceEnricher.TryEnrichAsync(findingsSnapshot, token);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (_logger.IsEnabled(LogLevel.Warning))

                    _logger.LogWarning(
                        ex,
                        "Findings snapshot evaluation confidence enrichment failed for RunId={RunId}; snapshot persisted without enrichment.",
                        run.RunId);
            }

            await SaveFindingsAsync(findingsSnapshot, uow, token);
            ctx.FindingsSnapshot = findingsSnapshot;

            RecordFindingsProducedForMetrics(findingsSnapshot);

            run.FindingsSnapshotId = findingsSnapshot.FindingsSnapshotId;
            await UpdateRunAsync(run, uow, token);

            if (findingsSnapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Complete)
            {
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.FindingsSnapshotSealed,
                        RunId = run.RunId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        DataJson = JsonSerializer.Serialize(
                            new
                            {
                                findingsSnapshotId = findingsSnapshot.FindingsSnapshotId.ToString("D"),
                                findingsSnapshot.SchemaVersion,
                                findingsCount = findingsSnapshot.Findings.Count,
                                generationStatus = findingsSnapshot.GenerationStatus.ToString(),
                            },
                            AuditJsonSerializationOptions.Instance),
                    },
                    uow,
                    token);

                await FindingsIntegrationEventPublishing.TryPublishHighSeverityCapturedAsync(
                    integrationEventOutbox,
                    integrationEventPublisher,
                    integrationEventsOptions,
                    logger,
                    findingsSnapshot,
                    scope,
                    publicSiteOptions.CurrentValue.BaseUrl,
                    uow.SupportsExternalTransaction ? uow.Connection : null,
                    uow.SupportsExternalTransaction ? uow.Transaction : null,
                    token);
            }
        }, ct);

        await ExecuteStageAsync(ctx, "authority.decisioning", "decisioning", async (_, token) =>
        {
            EnforceFindingsReadyForDecisioning(ctx.FindingsSnapshot!, run.RunId);

            (ManifestDocument manifest, DecisionTraceDto trace) = await _decisionEngine.DecideAsync(
                run.RunId,
                ctx.ContextSnapshot!.SnapshotId,
                ctx.GraphSnapshot!,
                ctx.FindingsSnapshot!,
                token);

            ApplyScope(trace, scope);
            ApplyScope(manifest, scope);

            await SaveTraceAsync(trace, uow, token);
            await SaveManifestAsync(manifest, uow, token);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ManifestGenerated,
                    RunId = run.RunId,
                    ManifestId = manifest.ManifestId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            manifest.ManifestHash,
                            manifest.RuleSetId
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                uow,
                token);

            ctx.Manifest = manifest;
            ctx.Trace = trace;

            await _closedLoopStrengtheningPass.TryStrengthenManifestAsync(
                scope,
                run,
                ctx.Request,
                manifest,
                token);

            if (trace is not RuleAuditTraceDto)
                throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

            // Defer DecisionTraceId / GoldenManifestId header writes until artifacts completes so TB-310 anchor
            // columns are sealed in one UpdateAsync together with ArtifactBundleId.
        }, ct);

        await ExecuteStageAsync(ctx, "authority.artifacts", "artifacts", async (_, token) =>
        {
            ArtifactBundle artifactBundle;
            try
            {
                IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
                    await _technologyLedgerRepository.GetByRunIdAsync(scope, run.RunId.ToString("D"), token);

                artifactBundle = await _artifactSynthesisService.SynthesizeAsync(
                    ctx.Manifest!,
                    ledgerEntries,
                    token);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Log without UoW: synthesis failed so the active transaction may already be
                // aborting; use the standalone overload to ensure the audit event persists.
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.ArtifactSynthesisFailed,
                        RunId = run.RunId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        ManifestId = ctx.Manifest!.ManifestId,
                        DataJson = JsonSerializer.Serialize(
                            new { reason = ex.GetType().Name },
                            AuditJsonSerializationOptions.Instance),
                    },
                    token);

                throw;
            }

            if (artifactBundle.Status == ArtifactBundleStatus.Partial)

                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.ArtifactSynthesisPartial,
                        RunId = run.RunId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        ManifestId = ctx.Manifest!.ManifestId,
                        DataJson = JsonSerializer.Serialize(
                            new { artifactBundle.BundleId, artifactBundle.Trace.TraceId },
                            AuditJsonSerializationOptions.Instance),
                    },
                    uow,
                    token);

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation(
                    "Authority pipeline artifacts synthesized: RunId={RunId}, BundleId={BundleId}, ArtifactCount={ArtifactCount}, SynthesisTraceId={SynthesisTraceId}",
                    run.RunId,
                    artifactBundle.BundleId,
                    artifactBundle.Artifacts.Count,
                    artifactBundle.Trace.TraceId);


            await SaveArtifactBundleAsync(artifactBundle, uow, token);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArtifactsGenerated,
                    RunId = run.RunId,
                    ManifestId = ctx.Manifest!.ManifestId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            artifactBundle.BundleId,
                            ArtifactCount = artifactBundle.Artifacts.Count
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                uow,
                token);

            ctx.ArtifactBundle = artifactBundle;

            if (ctx.Trace is not RuleAuditTraceDto ruleAuditTrace)
                throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

            run.DecisionTraceId = ruleAuditTrace.RuleAudit.DecisionTraceId;
            run.GoldenManifestId = ctx.Manifest!.ManifestId;
            run.ArtifactBundleId = artifactBundle.BundleId;
            // Seal coordinator-shaped manifest version with anchors so sp_FinalizeManifest pre-sealed path matches commit.
            run.CurrentManifestVersion = AuthorityCommitManifestVersionRules.ResolveContractManifestVersion(ctx.Manifest!);
            await UpdateRunAsync(run, uow, token);
        }, ct);
    }

    private void EnforceFindingsReadyForDecisioning(FindingsSnapshot snapshot, Guid runId)
    {
        if (snapshot is null)
            throw new ArgumentNullException(nameof(snapshot));

        AuthorityPipelineOptions opts = _authorityPipelineOptions.CurrentValue;

        if (snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Failed)
            throw new InvalidOperationException(
                $"Findings snapshot generation failed for all engines (RunId={runId:D}); aborting authority decisioning.");

        if (snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.PartiallyComplete)
        {
            bool blocking = FindingEngineFailureCommitClassifier.HasCommitBlockingFailures(snapshot.EngineFailures);

            if (blocking || opts.HaltOnPartialFindings)
                throw new InvalidOperationException(
                    $"Findings snapshot is only partially complete (RunId={runId:D}); authority pipeline halts before decisioning when a safety-critical engine failed or AuthorityPipeline:HaltOnPartialFindings is true.");

            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(
                    "Authority pipeline continuing decisioning with degraded finding coverage: RunId={RunId}, FailedEngineCount={FailedEngineCount}",
                    runId,
                    snapshot.EngineFailures.Count);
        }
    }

    private async Task ExecuteStageAsync(
        AuthorityPipelineContext ctx,
        string activityName,
        string stageName,
        Func<Activity?, CancellationToken, Task> stageWork,
        CancellationToken ct)
    {
        ActivityContext parentContext = ctx.RunActivity?.Context ?? default;

        using Activity? activity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
            activityName,
            ActivityKind.Internal,
            parentContext);

        activity?.SetTag("archlucid.run_id", ctx.Run.RunId.ToString("D"));
        activity?.SetTag("archlucid.stage.name", stageName);

        long startTicks = Stopwatch.GetTimestamp();
        string outcome = "success";
        DateTime stageStartedUtc = TimeProvider.System.UtcNowDateTime();
        IArchLucidUnitOfWork stageUow = ctx.UnitOfWork;

        await RecordStageStartedAsync(ctx.Run.RunId, stageName, stageStartedUtc, stageUow, ct);

        try
        {
            int stageIndex = Array.IndexOf(PipelineStageSequence, stageName);
            string fromState = stageIndex > 0
                ? PipelineStageSequence[stageIndex - 1]
                : "inline_authority_pipeline_stages";

            string nextStage =
                stageIndex >= 0 && stageIndex + 1 < PipelineStageSequence.Length
                    ? PipelineStageSequence[stageIndex + 1]
                    : "(finalize_authority_pipeline)";

            ArchLucidInstrumentation.RecordOrchestratorStateTransition(ctx.Run.RunId, fromState, stageName);

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation(
                    "Authority pipeline state transition: RunId={RunId}, CurrentStage={CurrentStage}, NextStage={NextStage}",
                    ctx.Run.RunId,
                    stageName,
                    nextStage);


            if (AuthorityPipelineStageCheckpoint.IsComplete(ctx.Run, stageName))
            {
                bool hydrated = await _stageContextHydrator.TryHydrateAsync(ctx, stageName, ct);

                if (hydrated)
                {
                    outcome = "skipped_checkpoint";
                    activity?.SetTag("archlucid.stage.skipped", true);

                    ArchLucidInstrumentation.AuthorityPipelineStageSkippedCheckpointTotal.Add(
                        1,
                        new KeyValuePair<string, object?>("stage", stageName));

                    if (_logger.IsEnabled(LogLevel.Information))

                        _logger.LogInformation(
                            "Authority pipeline stage skipped (checkpoint): RunId={RunId}, Stage={Stage}",
                            ctx.Run.RunId,
                            stageName);

                    return;
                }

                if (_logger.IsEnabled(LogLevel.Warning))

                    _logger.LogWarning(
                        "Authority pipeline checkpoint FK set but artefact missing; re-running stage: RunId={RunId}, Stage={Stage}",
                        ctx.Run.RunId,
                        stageName);
            }

            await stageWork(activity, ct);

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation(
                    "Authority pipeline stage completed: RunId={RunId}, Stage={Stage}",
                    ctx.Run.RunId,
                    stageName);
        }
        catch (Exception ex)
        {
            outcome = "error";
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.SetTag("error.type", ex.GetType().Name);
            throw;
        }
        finally
        {
            DateTime stageCompletedUtc = TimeProvider.System.UtcNowDateTime();
            string persistedOutcome = MapStageOutcomeStatus(outcome);

            try
            {
                await RecordStageCompletedAsync(
                    ctx.Run.RunId,
                    stageName,
                    persistedOutcome,
                    stageCompletedUtc,
                    stageUow,
                    ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (_logger.IsEnabled(LogLevel.Warning))

                    _logger.LogWarning(
                        ex,
                        "Failed to persist authority pipeline stage outcome: RunId={RunId}, Stage={Stage}",
                        ctx.Run.RunId,
                        stageName);
            }

            double elapsedMs = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
            ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds.Record(
                elapsedMs,
                new KeyValuePair<string, object?>("stage", stageName),
                new KeyValuePair<string, object?>("outcome", outcome));
        }
    }

    private async Task RecordStageStartedAsync(
        Guid runId,
        string stageName,
        DateTime startedUtc,
        IArchLucidUnitOfWork uow,
        CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
        {
            await _runStageOutcomesRepository.RecordStageStartedAsync(
                runId,
                stageName,
                startedUtc,
                ct,
                uow.Connection,
                uow.Transaction);

            return;
        }

        await _runStageOutcomesRepository.RecordStageStartedAsync(runId, stageName, startedUtc, ct);
    }

    private async Task RecordStageCompletedAsync(
        Guid runId,
        string stageName,
        string outcomeStatus,
        DateTime completedUtc,
        IArchLucidUnitOfWork uow,
        CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
        {
            await _runStageOutcomesRepository.RecordStageCompletedAsync(
                runId,
                stageName,
                outcomeStatus,
                completedUtc,
                ct,
                uow.Connection,
                uow.Transaction);

            return;
        }

        await _runStageOutcomesRepository.RecordStageCompletedAsync(
            runId,
            stageName,
            outcomeStatus,
            completedUtc,
            ct);
    }

    private static string MapStageOutcomeStatus(string executorOutcome) =>
        executorOutcome switch
        {
            "success" => "succeeded",
            "error" => "failed",
            "skipped_checkpoint" => "skipped",
            _ => "failed",
        };

    private async Task UpdateRunAsync(RunRecord run, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _runRepository.UpdateAsync(run, ct, uow.Connection, uow.Transaction);
        else
            await _runRepository.UpdateAsync(run, ct);
    }

    private async Task SaveContextAsync(ContextSnapshot snapshot, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _contextSnapshotRepository.SaveAsync(snapshot, ct, uow.Connection, uow.Transaction);
        else
            await _contextSnapshotRepository.SaveAsync(snapshot, ct);
    }

    private async Task SaveGraphAsync(GraphSnapshot snapshot, ScopeContext scope, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        // Cosmos graph snapshots replicate through dbo.CosmosGraphSnapshotOutbox after SQL authority commit.

        if (_cosmosDbOptionsMonitor.CurrentValue.GraphSnapshotsEnabled)
        {
            if (uow.SupportsExternalTransaction)
            {
                await _graphSnapshotSqlAuthorityWriter.SaveAsync(snapshot, ct, uow.Connection, uow.Transaction);
                await _cosmosGraphSnapshotOutboxRepository.EnqueueAsync(
                    snapshot.GraphSnapshotId,
                    snapshot.RunId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    uow.Connection,
                    uow.Transaction,
                    ct);
            }
            else
            {
                await _graphSnapshotSqlAuthorityWriter.SaveAsync(snapshot, ct);
                await _cosmosGraphSnapshotOutboxRepository.EnqueueAsync(
                    snapshot.GraphSnapshotId,
                    snapshot.RunId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    ct);
            }

            return;
        }

        if (uow.SupportsExternalTransaction)
            await _graphSnapshotRepository.SaveAsync(snapshot, ct, uow.Connection, uow.Transaction);
        else
            await _graphSnapshotRepository.SaveAsync(snapshot, ct);
    }

    private async Task SaveFindingsAsync(FindingsSnapshot snapshot, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _findingsSnapshotRepository.SaveAsync(snapshot, ct, uow.Connection, uow.Transaction);
        else
            await _findingsSnapshotRepository.SaveAsync(snapshot, ct);
    }

    private async Task SaveTraceAsync(DecisionTraceDto trace, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _decisionTraceRepository.SaveAsync(trace, ct, uow.Connection, uow.Transaction);
        else
            await _decisionTraceRepository.SaveAsync(trace, ct);
    }

    private async Task SaveManifestAsync(ManifestDocument manifest, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _goldenManifestRepository.SaveAsync(manifest, ct, uow.Connection, uow.Transaction);
        else
            await _goldenManifestRepository.SaveAsync(manifest, ct);
    }

    private async Task SaveArtifactBundleAsync(ArtifactBundle bundle, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _artifactBundleRepository.SaveAsync(bundle, ct, uow.Connection, uow.Transaction);
        else
            await _artifactBundleRepository.SaveAsync(bundle, ct);
    }

    private static void RecordFindingsProducedForMetrics(FindingsSnapshot snapshot)
    {
        if (snapshot.Findings.Count == 0)
            return;

        foreach (IGrouping<FindingSeverity, Finding> group in snapshot.Findings.GroupBy(static f => f.Severity))
        {
            TagList tags = new() { { "severity", group.Key.ToString() } };

            ArchLucidInstrumentation.FindingsProducedTotal.Add(group.Count(), tags);
        }
    }

    private static void ApplyScope(DecisionTraceDto trace, ScopeContext scope)
    {
        if (trace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        RuleAuditTracePayload audit = ruleAuditTrace.RuleAudit;
        audit.TenantId = scope.TenantId;
        audit.WorkspaceId = scope.WorkspaceId;
        audit.ProjectId = scope.ProjectId;
    }

    private static void ApplyScope(ManifestDocument manifest, ScopeContext scope)
    {
        manifest.TenantId = scope.TenantId;
        manifest.WorkspaceId = scope.WorkspaceId;
        manifest.ProjectId = scope.ProjectId;
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadKnowledgeModelAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (_architectureIntelligencePersistence is null)
            return null;

        return await _architectureIntelligencePersistence
            .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId.ToString("D"), cancellationToken)
            .ConfigureAwait(false);
    }
}

