using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Analysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

using Serilog.Context;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Queued authority pipeline resume path for <see cref="AuthorityRunOrchestrator" />.</summary>
public sealed partial class AuthorityRunOrchestrator
{
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

        AuthorityPipelineContext? executedContext = null;

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunRecord existing = await ResolvePreAllocatedRunHeaderAsync(scope, request.RunId, cancellationToken);

            if (_runStateTransitionService.ShouldSkipQueuedAuthorityPipelineCompletion(existing.ContextSnapshotId))
            {
                if (logger.IsEnabled(LogLevel.Information))

                    logger.LogInformation(
                        "Queued authority completion skipped (already has context): RunId={RunId}",
                        request.RunId);


                LogAgentExecutionStateTransition(request.RunId, "queued_resume", "skipped_idempotent_context_exists",
                    "(none)");

                return existing;
            }

            TimeSpan pipelineTimeout = authorityPipelineOptions.CurrentValue.PipelineTimeout;
            // Redelivery uses the existing run admission stamp, never a fresh full budget.

            if (pipelineTimeout > TimeSpan.Zero && existing.CreatedUtc != default)
            {
                TimeSpan queueAge = _analysisClock.UtcNowDateTime() - existing.CreatedUtc;

                if (queueAge >= pipelineTimeout)
                    throw new AnalysisStageExecutionException("authority.queue", AnalysisStageOutcome.NotStarted);

                if (queueAge > TimeSpan.Zero)
                    pipelineTimeout -= queueAge;
            }

            using AnalysisExecutionBudget budget = BeginAnalysisBudget(pipelineTimeout, cancellationToken);
            CancellationToken pipelineCt = budget.Token;

            RunRecord run = existing;

            await EnsureAdmittedRunCreateTimePinsIfMissingAsync(run, request, scope, uow, pipelineCt);

            LogAgentExecutionStateTransition(run.RunId, "queued_resume", "inline_authority_pipeline_stages", "(none)");

            await using IAsyncDisposable executionConcurrencyLease =
                await _tenantAuthorityPipelineConcurrencyGate.AcquireExecutionSlotAsync(
                    run.TenantId,
                    run.RunId,
                    failFastWhenUnavailable: false,
                    pipelineCt);

            using Activity? runActivity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
                ArchLucidInstrumentation.AuthorityRunRootActivityName);
            runActivity?.SetTag("archlucid.run_id", run.RunId.ToString("D"));

            string logicalCorrelation =
                ActivityCorrelation.FindTagValueInChain(runActivity?.Parent,
                    ActivityCorrelation.LogicalCorrelationIdTag)
                ?? run.RunId.ToString("D");
            runActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);

            using IDisposable serilogCorrelation = LogContext.PushProperty("CorrelationId", logicalCorrelation);

            if (string.IsNullOrWhiteSpace(run.OtelTraceId))
                run.OtelTraceId = Activity.Current?.TraceId.ToString();

            AuthorityPipelineContext ctx = new()
            {
                Run = run,
                Request = request,
                UnitOfWork = uow,
                Scope = scope,
                RunActivity = runActivity,
                ExecutionBudget = budget
            };

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
                            Queued = true,
                            ResumedFromQueue = true
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                pipelineCt);

            if (_authorityPipelineStagesExecutionDriver.RequiresCommittedRunHeaderBeforeStages)
                await CommitUnitOfWorkWithTransientRetryAsync(uow, pipelineCt);

            await PersistRunHeaderEvidenceAnchorsBeforePipelineStagesAsync(run, request, uow, pipelineCt);

            executedContext = ctx;
            AuthorityPipelineStagesExecutionResult stageResult =
                await _authorityPipelineStagesExecutionDriver.ExecuteStagesAsync(ctx, pipelineCt);

            if (stageResult.NeedsFinalizeOnCurrentUnitOfWork)
            {
                LogAgentExecutionStateTransition(run.RunId, "inline_authority_pipeline_stages", "authority_pipeline_finalize",
                    "(none)");

                budget.EnsureCanContinue("authority.finalize");
                RunRecord finalized = await _authorityCommittedPipelineFinalizer.FinalizeAsync(
                    run,
                    ctx.ContextSnapshot!,
                    ctx.FindingsSnapshot!,
                    ctx.Manifest!,
                    ctx.Trace!,
                    scope,
                    uow,
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
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested &&
                                   (ex is OperationCanceledException ||
                                    ex is AnalysisStageExecutionException { Outcome: AnalysisStageOutcome.TimedOut or AnalysisStageOutcome.NotStarted }))
        {
            await uow.RollbackAsync(CancellationToken.None);

            await RecordTerminatedStageOutcomesAsync(executedContext);

            logger.LogError(
                "Queued authority pipeline timed out after {PipelineTimeout}. RunId={RunId}",
                authorityPipelineOptions.CurrentValue.PipelineTimeout,
                pipelineRunIdForDiagnostics);

            ArchLucidInstrumentation.PipelineTimeoutsTotal.Add(1);

            throw;
        }
        catch (Exception ex)
        {
            await uow.RollbackAsync(CancellationToken.None);

            await RecordTerminatedStageOutcomesAsync(executedContext);

            logger.LogError(
                ex,
                "Queued authority pipeline failed; transaction rolled back. RunId={RunId}",
                pipelineRunIdForDiagnostics);

            throw;
        }
    }
}
