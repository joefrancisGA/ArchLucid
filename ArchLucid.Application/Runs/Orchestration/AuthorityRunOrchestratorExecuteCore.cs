using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

using Serilog.Context;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Inline and deferred-queue execution paths for <see cref="AuthorityRunOrchestrator.ExecuteAsync" />.</summary>
public sealed partial class AuthorityRunOrchestrator
{
    private async Task<RunRecord> ExecuteCoreAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken,
        string? evidenceBundleIdForDeferredWork,
        IArchLucidUnitOfWork uow,
        bool callerOwnsUnitOfWork)
    {
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
            Guid runId = request.RunId != Guid.Empty ? request.RunId : Guid.NewGuid();
            RunRecord run;

            if (request.RunId != Guid.Empty)
            {
                RunRecord? existingRun = await _runRepository.GetByIdAsync(scope, runId, pipelineCt);

                if (existingRun is not null)
                {
                    run = existingRun;
                    LogAgentExecutionStateTransition(run.RunId, "async_create_admitted", "run_persisted", "(none)");
                }
                else
                {
                    run = BuildNewRunRecord(runId, request, scope);
                    await SaveRunWithTransientRetryAsync(run, uow, pipelineCt);
                    ArchLucidInstrumentation.RunsCreatedTotal.Add(1);
                    LogAgentExecutionStateTransition(run.RunId, "authority_pipeline_start", "run_persisted", "(none)");
                }
            }
            else
            {
                run = BuildNewRunRecord(runId, request, scope);
                await SaveRunWithTransientRetryAsync(run, uow, pipelineCt);
                ArchLucidInstrumentation.RunsCreatedTotal.Add(1);
                LogAgentExecutionStateTransition(run.RunId, "authority_pipeline_start", "run_persisted", "(none)");
            }

            RunRecord runForActivity = run;
            using Activity? runActivity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
                ArchLucidInstrumentation.AuthorityRunRootActivityName);
            runActivity?.SetTag("archlucid.run_id", runForActivity.RunId.ToString("D"));

            string logicalCorrelation =
                ActivityCorrelation.FindTagValueInChain(runActivity?.Parent,
                    ActivityCorrelation.LogicalCorrelationIdTag)
                ?? runForActivity.RunId.ToString("D");
            runActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);

            using IDisposable _ = LogContext.PushProperty("CorrelationId", logicalCorrelation);

            if (string.IsNullOrWhiteSpace(run.OtelTraceId))
                run.OtelTraceId = Activity.Current?.TraceId.ToString();

            pipelineRunIdForDiagnostics = run.RunId;

            if (logger.IsEnabled(LogLevel.Information))

                logger.LogInformation(
                    "Authority pipeline started: RunId={RunId}, ProjectId={ProjectId}, TenantId={TenantId}, WorkspaceId={WorkspaceId}",
                    run.RunId,
                    LogSanitizer.Sanitize(request.ProjectId),
                    scope.TenantId,
                    scope.WorkspaceId);

            request.RunId = run.RunId;

            bool queue = await asyncAuthorityPipelineModeResolver.ShouldQueueContextAndGraphStagesAsync(pipelineCt)
                         && !string.IsNullOrWhiteSpace(evidenceBundleIdForDeferredWork);

            if (queue)
            {
                string deferredEvidenceBundleId = evidenceBundleIdForDeferredWork!.Trim();

                LogAgentExecutionStateTransition(run.RunId, "run_persisted", "queued_authority_pipeline", "(none)");


                AuthorityPipelineWorkPayload payload = new()
                {
                    ContextIngestionRequest = request,
                    EvidenceBundleId = deferredEvidenceBundleId
                };

                await EnqueueDeferredWorkWithTransientRetryAsync(
                    run.RunId,
                    scope,
                    AuthorityPipelineWorkPayloadJson.Serialize(payload),
                    uow,
                    pipelineCt);

                if (!callerOwnsUnitOfWork)
                    await CommitUnitOfWorkWithTransientRetryAsync(uow, pipelineCt);

                await auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.RunStarted,
                        RunId = run.RunId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
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


                LogAgentExecutionStateTransition(run.RunId, "queued_authority_pipeline", "deferred_authority_pipeline_return",
                    "(none)");

                return run;
            }

            LogAgentExecutionStateTransition(run.RunId, "run_persisted", "inline_authority_pipeline_stages", "(none)");

            if (callerOwnsUnitOfWork)
            {
                throw new InvalidOperationException(
                    "Enlisted unit of work is only supported when async authority pipeline queue mode is active. "
                    + "Enable FeatureManagement:FeatureFlags:AsyncAuthorityPipeline for SQL storage.");
            }

            // Commit the run persist so the lock is released; otherwise, audit events in stages will deadlock.
            await CommitUnitOfWorkWithTransientRetryAsync(uow, pipelineCt);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunStarted,
                    RunId = run.RunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            run.ProjectId,
                            Queued = false
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                pipelineCt);

            IArchLucidUnitOfWork stagesUow = await unitOfWorkFactory.CreateAsync(pipelineCt);
            try
            {
                await using IAsyncDisposable executionConcurrencyLease =
                    await _tenantAuthorityPipelineConcurrencyGate.AcquireExecutionSlotAsync(
                        scope.TenantId,
                        run.RunId,
                        authorityPipelineOptions.CurrentValue.Concurrency.RejectInlineCreateWhenConcurrencyUnavailable,
                        pipelineCt);


                AuthorityPipelineContext ctx = new()
                {
                    Run = run,
                    Request = request,
                    UnitOfWork = stagesUow,
                    Scope = scope,
                    RunActivity = runActivity
                };

                AuthorityPipelineStagesExecutionResult stageResult =
                    await _authorityPipelineStagesExecutionDriver.ExecuteStagesAsync(ctx, pipelineCt);

                if (stageResult.NeedsFinalizeOnCurrentUnitOfWork)
                {
                    LogAgentExecutionStateTransition(run.RunId, "inline_authority_pipeline_stages", "authority_pipeline_finalize",
                        "(none)");

                    RunEngineProvenanceApplicator.TryApplyFromEffectiveAliasId(
                        run,
                        request.EffectiveModelAliasId,
                        _agentModelAliasRegistry);

                    await SaveRunWithTransientRetryAsync(run, stagesUow, pipelineCt);

                    RunRecord finalized = await _authorityCommittedPipelineFinalizer.FinalizeAsync(
                        run,
                        ctx.ContextSnapshot!,
                        ctx.FindingsSnapshot!,
                        ctx.Manifest!,
                        ctx.Trace!,
                        scope,
                        stagesUow,
                        pipelineCt);

                    LogAgentExecutionStateTransition(run.RunId, "authority_pipeline_finalize", "authority_pipeline_committed",
                        "(none)");

                    return finalized;
                }

                if (stageResult.CompletedRun is null)
                    throw new InvalidOperationException("Authority pipeline stages completed without a run record.");

                LogAgentExecutionStateTransition(run.RunId, "inline_authority_pipeline_stages",
                    "authority_pipeline_finished_out_of_band", "(none)");

                return stageResult.CompletedRun;
            }
            finally
            {
                await stagesUow.DisposeAsync();
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            if (!callerOwnsUnitOfWork)
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
            if (!callerOwnsUnitOfWork)
                await uow.RollbackAsync(cancellationToken);

            logger.LogError(
                ex,
                "Authority pipeline failed; transaction rolled back. RunId={RunId}",
                pipelineRunIdForDiagnostics);

            throw;
        }
    }
}
