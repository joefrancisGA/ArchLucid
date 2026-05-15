using System.Diagnostics;
using System.Text.Json;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.Pipeline;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     Legacy SQL-backed authority pipeline coordinating ingestion, knowledge graph, findings, decisioning, artifact synthesis,
///     audit, and post-commit retrieval indexing. Registered in host composition as the implementation behind the
///     application-layer <c>IAuthorityRunOrchestrator</c> port.
/// </summary>
public sealed class AuthorityRunOrchestrator(
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IRunRepository runRepository,
    IAuthorityPipelineStagesExecutionDriver authorityPipelineStagesExecutionDriver,
    IAuthorityCommittedPipelineFinalizer authorityCommittedPipelineFinalizer,
    IAuthorityPipelineWorkRepository authorityPipelineWorkRepository,
    IAsyncAuthorityPipelineModeResolver asyncAuthorityPipelineModeResolver,
    IOptionsMonitor<AuthorityPipelineOptions> authorityPipelineOptions,
    ILogger<AuthorityRunOrchestrator> logger)
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuthorityPipelineStagesExecutionDriver _authorityPipelineStagesExecutionDriver =
        authorityPipelineStagesExecutionDriver
        ?? throw new ArgumentNullException(nameof(authorityPipelineStagesExecutionDriver));

    private readonly IAuthorityCommittedPipelineFinalizer _authorityCommittedPipelineFinalizer =
        authorityCommittedPipelineFinalizer
        ?? throw new ArgumentNullException(nameof(authorityCommittedPipelineFinalizer));

    /// <inheritdoc />
    /// <remarks>
    ///     Persists the run under the current <see cref="ScopeContext" />, records telemetry tags, then chooses one of two
    ///     paths: (1) <em>deferred queue</em> — when <see cref="IAsyncAuthorityPipelineModeResolver" /> requests queueing and
    ///     <paramref name="evidenceBundleIdForDeferredWork" /> is non-empty, enqueues outbox payload and returns early after
    ///     commit; or (2) <em>inline execution</em> — runs
    ///     <see cref="IAuthorityPipelineStagesExecutionDriver.ExecuteStagesAsync" /> and
    ///     <see cref="IAuthorityCommittedPipelineFinalizer.FinalizeAsync" /> in-process. Pipeline duration is bounded by
    ///     <see cref="AuthorityPipelineOptions.PipelineTimeout" /> via a linked cancellation token (timeout surfaces as
    ///     <see cref="OperationCanceledException" /> filtered against caller cancellation).
    /// </remarks>
    public async Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);

        Guid? pipelineRunIdForDiagnostics = null;

        try
        {
            TimeSpan pipelineTimeout = authorityPipelineOptions.CurrentValue.PipelineTimeout;
            using CancellationTokenSource
                linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            if (pipelineTimeout > TimeSpan.Zero)

                linkedCts.CancelAfter(pipelineTimeout);


            CancellationToken pipelineCt = linkedCts.Token;

            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunRecord run = new()
            {
                RunId = Guid.NewGuid(),
                ArchitectureRequestId = request.ArchitectureRequestId,
                ProjectId = request.ProjectId,
                Description = request.Description,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                StructuralExecutionMode = StructuralExecutionMode.Simulator
            };
            ApplyScope(run, scope);

            using Activity? runActivity = ArchLucidInstrumentation.AuthorityRun.StartActivity();
            runActivity?.SetTag("archlucid.run_id", run.RunId.ToString("D"));

            string logicalCorrelation =
                ActivityCorrelation.FindTagValueInChain(runActivity?.Parent,
                    ActivityCorrelation.LogicalCorrelationIdTag)
                ?? run.RunId.ToString("D");
            runActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);

            using IDisposable _ = LogContext.PushProperty("CorrelationId", logicalCorrelation);

            run.OtelTraceId = Activity.Current?.TraceId.ToString();

            await SaveRunAsync(run, uow, pipelineCt);

            ArchLucidInstrumentation.RunsCreatedTotal.Add(1);

            pipelineRunIdForDiagnostics = run.RunId;

            if (logger.IsEnabled(LogLevel.Information))

                logger.LogInformation(
                    "Authority pipeline started: RunId={RunId}, ProjectId={ProjectId}, TenantId={TenantId}, WorkspaceId={WorkspaceId}",
                    run.RunId,
                    LogSanitizer.Sanitize(request.ProjectId),
                    scope.TenantId,
                    scope.WorkspaceId);


            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunStarted,
                    RunId = run.RunId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            run.ProjectId,
                            Queued = false
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                pipelineCt);

            request.RunId = run.RunId;

            bool queue = await asyncAuthorityPipelineModeResolver.ShouldQueueContextAndGraphStagesAsync(pipelineCt)
                         && !string.IsNullOrWhiteSpace(evidenceBundleIdForDeferredWork);

            if (queue)
            {
                string deferredEvidenceBundleId = evidenceBundleIdForDeferredWork!.Trim();

                if (logger.IsEnabled(LogLevel.Information))

                    logger.LogInformation(
                        "Authority pipeline orchestrator transition: RunId={RunId}, CurrentState={CurrentState}, NextState={NextState}",
                        run.RunId,
                        "run_persisted",
                        "queued_authority_pipeline");


                AuthorityPipelineWorkPayload payload = new()
                {
                    ContextIngestionRequest = request,
                    EvidenceBundleId = deferredEvidenceBundleId
                };

                await authorityPipelineWorkRepository.EnqueueAsync(
                    run.RunId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    AuthorityPipelineWorkPayloadJson.Serialize(payload),
                    pipelineCt);

                await uow.CommitAsync(pipelineCt);

                await auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.RunStarted,
                        RunId = run.RunId,
                        DataJson = JsonSerializer.Serialize(
                            new
                            {
                                run.ProjectId,
                                Queued = true
                            },
                            AuditJsonSerializationOptions.Instance)
                    },
                    pipelineCt);

                if (logger.IsEnabled(LogLevel.Information))

                    logger.LogInformation(
                        "Authority pipeline deferred (queued): RunId={RunId}, ProjectId={ProjectId}",
                        run.RunId,
                        LogSanitizer.Sanitize(request.ProjectId));


                return run;
            }

            if (logger.IsEnabled(LogLevel.Information))

                logger.LogInformation(
                    "Authority pipeline orchestrator transition: RunId={RunId}, CurrentState={CurrentState}, NextState={NextState}",
                    run.RunId,
                    "run_persisted",
                    "inline_authority_pipeline_stages");


            if (_authorityPipelineStagesExecutionDriver.RequiresCommittedRunHeaderBeforeStages)
                await uow.CommitAsync(pipelineCt);


            AuthorityPipelineContext ctx = new()
            {
                Run = run,
                Request = request,
                UnitOfWork = uow,
                Scope = scope,
                RunActivity = runActivity
            };

            AuthorityPipelineStagesExecutionResult stageResult =
                await _authorityPipelineStagesExecutionDriver.ExecuteStagesAsync(ctx, pipelineCt);

            if (stageResult.NeedsFinalizeOnCurrentUnitOfWork)
            {
                return await _authorityCommittedPipelineFinalizer.FinalizeAsync(
                    run,
                    ctx.ContextSnapshot!,
                    ctx.FindingsSnapshot!,
                    ctx.Manifest!,
                    ctx.Trace!,
                    scope,
                    uow,
                    pipelineCt);
            }

            if (stageResult.CompletedRun is null)
                throw new InvalidOperationException("Authority pipeline stages completed without a run record.");

            return stageResult.CompletedRun;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            await uow.RollbackAsync(cancellationToken);

            logger.LogError(
                "Authority pipeline timed out after {PipelineTimeout}. RunId={RunId}",
                authorityPipelineOptions.CurrentValue.PipelineTimeout,
                pipelineRunIdForDiagnostics);

            ArchLucidInstrumentation.PipelineTimeoutsTotal.Add(1);

            throw;
        }
        catch (Exception ex)
        {
            await uow.RollbackAsync(cancellationToken);

            logger.LogError(
                ex,
                "Authority pipeline failed; transaction rolled back. RunId={RunId}",
                pipelineRunIdForDiagnostics);

            throw;
        }
    }

    /// <inheritdoc />
    /// <remarks>
    ///     Resumes a run that was previously persisted with queue semantics: validates the row is still missing a context
    ///     snapshot (idempotent skip), applies the same pipeline timeout linkage as
    ///     <see cref="ExecuteAsync" />, emits a resumed audit envelope, then executes staged work and finalization.
    /// </remarks>
    public async Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);

        Guid? pipelineRunIdForDiagnostics = request.RunId;

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunRecord? existing = await _runRepository.GetByIdAsync(scope, request.RunId, cancellationToken);
            if (existing is null)
                throw new InvalidOperationException(
                    $"Run '{request.RunId:D}' was not found for queued authority completion.");

            if (existing.ContextSnapshotId is not null)
            {
                if (logger.IsEnabled(LogLevel.Information))

                    logger.LogInformation(
                        "Queued authority completion skipped (already has context): RunId={RunId}",
                        request.RunId);


                return existing;
            }

            TimeSpan pipelineTimeout = authorityPipelineOptions.CurrentValue.PipelineTimeout;
            using CancellationTokenSource
                linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            if (pipelineTimeout > TimeSpan.Zero)

                linkedCts.CancelAfter(pipelineTimeout);


            CancellationToken pipelineCt = linkedCts.Token;

            RunRecord run = existing;

            if (logger.IsEnabled(LogLevel.Information))

                logger.LogInformation(
                    "Authority pipeline orchestrator transition: RunId={RunId}, CurrentState={CurrentState}, NextState={NextState}",
                    run.RunId,
                    "queued_resume",
                    "inline_authority_pipeline_stages");


            using Activity? runActivity = ArchLucidInstrumentation.AuthorityRun.StartActivity();
            runActivity?.SetTag("archlucid.run_id", run.RunId.ToString("D"));

            string logicalCorrelation =
                ActivityCorrelation.FindTagValueInChain(runActivity?.Parent,
                    ActivityCorrelation.LogicalCorrelationIdTag)
                ?? run.RunId.ToString("D");
            runActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);

            using IDisposable serilogCorrelation = LogContext.PushProperty("CorrelationId", logicalCorrelation);

            AuthorityPipelineContext ctx = new()
            {
                Run = run,
                Request = request,
                UnitOfWork = uow,
                Scope = scope,
                RunActivity = runActivity
            };

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunStarted,
                    RunId = run.RunId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            run.ProjectId,
                            Queued = true,
                            ResumedFromQueue = true
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                pipelineCt);

            if (_authorityPipelineStagesExecutionDriver.RequiresCommittedRunHeaderBeforeStages)
                await uow.CommitAsync(pipelineCt);

            AuthorityPipelineStagesExecutionResult stageResult =
                await _authorityPipelineStagesExecutionDriver.ExecuteStagesAsync(ctx, pipelineCt);

            if (stageResult.NeedsFinalizeOnCurrentUnitOfWork)
            {
                return await _authorityCommittedPipelineFinalizer.FinalizeAsync(
                    run,
                    ctx.ContextSnapshot!,
                    ctx.FindingsSnapshot!,
                    ctx.Manifest!,
                    ctx.Trace!,
                    scope,
                    uow,
                    pipelineCt);
            }

            if (stageResult.CompletedRun is null)
                throw new InvalidOperationException("Authority pipeline stages completed without a run record.");

            return stageResult.CompletedRun;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            await uow.RollbackAsync(cancellationToken);

            logger.LogError(
                "Queued authority pipeline timed out after {PipelineTimeout}. RunId={RunId}",
                authorityPipelineOptions.CurrentValue.PipelineTimeout,
                pipelineRunIdForDiagnostics);

            ArchLucidInstrumentation.PipelineTimeoutsTotal.Add(1);

            throw;
        }
        catch (Exception ex)
        {
            await uow.RollbackAsync(cancellationToken);

            logger.LogError(
                ex,
                "Queued authority pipeline failed; transaction rolled back. RunId={RunId}",
                pipelineRunIdForDiagnostics);

            throw;
        }
    }

    private async Task SaveRunAsync(RunRecord run, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        if (uow.SupportsExternalTransaction)
            await _runRepository.SaveAsync(run, ct, uow.Connection, uow.Transaction);
        else
            await _runRepository.SaveAsync(run, ct);
    }

    private static void ApplyScope(RunRecord run, ScopeContext scope)
    {
        run.TenantId = scope.TenantId;
        run.WorkspaceId = scope.WorkspaceId;
        run.ScopeProjectId = scope.ProjectId;
    }
}
