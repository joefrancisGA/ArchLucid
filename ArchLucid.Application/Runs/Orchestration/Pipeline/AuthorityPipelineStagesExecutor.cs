using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Default pipeline executor with one OpenTelemetry span per major stage (<c>authority.*</c> activity names),
///     explicitly parented to <see cref="AuthorityPipelineContext.RunActivity" /> when present.
/// </summary>
public sealed class AuthorityPipelineStagesExecutor(
    IAuthorityPipelineContextIngestionStage contextIngestionStage,
    IAuthorityPipelineGraphStage graphStage,
    IAuthorityPipelineFindingsStage findingsStage,
    IAuthorityPipelineDecisioningStage decisioningStage,
    IAuthorityPipelineArtifactsStage artifactsStage,
    AuthorityPipelineStageContextHydrator stageContextHydrator,
    IRunGovernanceScopePinService runGovernanceScopePinService,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    ILogger<AuthorityPipelineStagesExecutor> logger,
    IOptionsMonitor<AnalysisStageExecutionOptions>? executionOptions = null,
    IOptionsMonitor<AuthorityPipelineOptions>? pipelineOptions = null,
    TimeProvider? timeProvider = null) : IAuthorityPipelineStagesExecutor
{
    private readonly IAuthorityPipelineContextIngestionStage _contextIngestionStage =
        contextIngestionStage ?? throw new ArgumentNullException(nameof(contextIngestionStage));

    private readonly IAuthorityPipelineGraphStage _graphStage =
        graphStage ?? throw new ArgumentNullException(nameof(graphStage));

    private readonly IAuthorityPipelineFindingsStage _findingsStage =
        findingsStage ?? throw new ArgumentNullException(nameof(findingsStage));

    private readonly IAuthorityPipelineDecisioningStage _decisioningStage =
        decisioningStage ?? throw new ArgumentNullException(nameof(decisioningStage));

    private readonly IAuthorityPipelineArtifactsStage _artifactsStage =
        artifactsStage ?? throw new ArgumentNullException(nameof(artifactsStage));

    private readonly AuthorityPipelineStageContextHydrator _stageContextHydrator =
        stageContextHydrator ?? throw new ArgumentNullException(nameof(stageContextHydrator));

    private readonly IRunGovernanceScopePinService _runGovernanceScopePinService =
        runGovernanceScopePinService ?? throw new ArgumentNullException(nameof(runGovernanceScopePinService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly ILogger<AuthorityPipelineStagesExecutor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    private static readonly string[] PipelineStageSequence = AuthorityPipelineStageNames.Sequence;

    /// <inheritdoc />
    public async Task ExecuteAfterRunPersistedAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(ctx);

        using IDisposable restoredPilotScope = _runGovernanceScopePinService.BeginRestoredScope(ctx.Run);

        using AnalysisExecutionBudget? ownedBudget = ctx.ExecutionBudget is null
            ? new(executionOptions?.CurrentValue ?? new AnalysisStageExecutionOptions(), _clock,
                pipelineOptions?.CurrentValue.PipelineTimeout ?? new AuthorityPipelineOptions().PipelineTimeout, ct)
            : null;
        AnalysisExecutionBudget budget = ctx.ExecutionBudget ?? ownedBudget!;
        var stages = BuildStageSequence(ctx);
        int index = 0;

        try
        {
            for (; index < stages.Length; index++)
            {
                var stage = stages[index];
                await ExecuteStageAsync(ctx, stage.Activity, stage.Name, stage.Work, budget, ct);
            }
        }
        catch
        {
            DateTime nowUtc = _clock.UtcNowDateTime();

            foreach (var blocked in stages.Skip(index + 1))
                ctx.TerminalStageTimeline.Add(StageTimelineSummary.FromRow(blocked.Name, nowUtc, nowUtc, AnalysisStageOutcome.NotStarted));

            throw;
        }
    }

    internal IDisposable BeginRecoveryGovernanceScope(AuthorityPipelineContext ctx) =>
        _runGovernanceScopePinService.BeginRestoredScope(ctx.Run);

    internal Task<bool> HydrateRecoveryStageAsync(AuthorityPipelineContext ctx, string stage, CancellationToken ct) =>
        _stageContextHydrator.TryHydrateAsync(ctx, stage, ct);

    internal async Task ExecuteRecoveryStageAsync(AuthorityPipelineContext ctx, string stage, CancellationToken ct)
    {
        var selected = BuildStageSequence(ctx).Single(item => item.Name == stage);
        await ExecuteStageAsync(ctx, selected.Activity, selected.Name, selected.Work, ctx.ExecutionBudget!, ct);
    }

    private (string Activity, string Name, Func<CancellationToken, Task> Work)[] BuildStageSequence(AuthorityPipelineContext ctx) =>
        [
            ("authority.context_ingestion", AuthorityPipelineStageNames.ContextIngestion, token => _contextIngestionStage.ExecuteAsync(ctx, token)),
            ("authority.graph", AuthorityPipelineStageNames.Graph, token => _graphStage.ExecuteAsync(ctx, token)),
            ("authority.findings", AuthorityPipelineStageNames.Findings, token => _findingsStage.ExecuteAsync(ctx, token)),
            ("authority.decisioning", AuthorityPipelineStageNames.Decisioning, token => _decisioningStage.ExecuteAsync(ctx, token)),
            ("authority.artifacts", AuthorityPipelineStageNames.Artifacts, token => _artifactsStage.ExecuteAsync(ctx, token)),
        ];

    private async Task ExecuteStageAsync(
        AuthorityPipelineContext ctx,
        string activityName,
        string stageName,
        Func<CancellationToken, Task> stageWork,
        AnalysisExecutionBudget budget,
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
        string outcome = AnalysisStageOutcome.NotStarted;
        DateTime stageStartedUtc = _clock.UtcNowDateTime();
        bool started = false;
        bool checkpointReused = false;
        IArchLucidUnitOfWork stageUow = ctx.UnitOfWork;

        try
        {
            await budget.ExecuteAsync(activityName, async stageToken =>
            {
                await RecordStageStartedAsync(ctx.Run.RunId, stageName, stageStartedUtc, stageUow, stageToken);
                started = true;

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
                {
                    _logger.LogInformation(
                        "Authority pipeline state transition: RunId={RunId}, CurrentStage={CurrentStage}, NextStage={NextStage}",
                        ctx.Run.RunId,
                        stageName,
                        nextStage);
                }

                if (!ctx.UsesDurableRecovery && AuthorityPipelineStageCheckpoint.IsComplete(ctx.Run, stageName))
                {
                    bool hydrated = await _stageContextHydrator.TryHydrateAsync(ctx, stageName, stageToken);

                    if (hydrated)
                    {
                        checkpointReused = true;
                        activity?.SetTag("archlucid.stage.skipped", true);

                        ArchLucidInstrumentation.AuthorityPipelineStageSkippedCheckpointTotal.Add(
                            1,
                            new KeyValuePair<string, object?>("stage", stageName));

                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation(
                                "Authority pipeline stage skipped (checkpoint): RunId={RunId}, Stage={Stage}",
                                ctx.Run.RunId,
                                stageName);
                        }

                        return;
                    }

                    if (_logger.IsEnabled(LogLevel.Warning))
                    {
                        _logger.LogWarning(
                            "Authority pipeline checkpoint FK set but artefact missing; re-running stage: RunId={RunId}, Stage={Stage}",
                            ctx.Run.RunId,
                            stageName);
                    }
                }

                await stageWork(stageToken);

                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation(
                        "Authority pipeline stage completed: RunId={RunId}, Stage={Stage}",
                        ctx.Run.RunId,
                        stageName);
                }
            }, ct, observe: observed =>
            {
                outcome = checkpointReused && observed.Status == AnalysisStageOutcome.Succeeded
                    ? AnalysisStageOutcome.CheckpointReused
                    : observed.Status;
                activity?.SetTag("archlucid.analysis.attempts", observed.Attempts);
            }, stageActivity: activity);
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.SetTag("error.type", ex.GetType().Name);
            throw;
        }
        finally
        {
            DateTime stageCompletedUtc = _clock.UtcNowDateTime();
            ctx.TerminalStageTimeline.Add(StageTimelineSummary.FromRow(stageName, stageStartedUtc, stageCompletedUtc, outcome));
            activity?.SetTag("archlucid.analysis.outcome", outcome);

            try
            {
                if (started)
                {
                    await RecordStageCompletedAsync(
                        ctx.Run.RunId,
                        stageName,
                        outcome,
                        stageCompletedUtc,
                        stageUow,
                        ct);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException || outcome != AnalysisStageOutcome.Succeeded)
            {
                // A canceled outcome write must not replace a stage that already failed.

                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Failed to persist authority pipeline stage outcome: RunId={RunId}, Stage={Stage}",
                        ctx.Run.RunId,
                        stageName);
                }
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
}
