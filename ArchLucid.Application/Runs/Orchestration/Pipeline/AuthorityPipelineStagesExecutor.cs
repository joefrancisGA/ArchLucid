using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

using Microsoft.Extensions.Logging;

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
    IRunStageOutcomesRepository runStageOutcomesRepository,
    ILogger<AuthorityPipelineStagesExecutor> logger) : IAuthorityPipelineStagesExecutor
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

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly ILogger<AuthorityPipelineStagesExecutor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private static readonly string[] PipelineStageSequence = AuthorityPipelineStageNames.Sequence;

    /// <inheritdoc />
    public async Task ExecuteAfterRunPersistedAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(ctx);

        await ExecuteStageAsync(
            ctx,
            "authority.context_ingestion",
            AuthorityPipelineStageNames.ContextIngestion,
            (_, token) => _contextIngestionStage.ExecuteAsync(ctx, token),
            ct);

        await ExecuteStageAsync(
            ctx,
            "authority.graph",
            AuthorityPipelineStageNames.Graph,
            (_, token) => _graphStage.ExecuteAsync(ctx, token),
            ct);

        await ExecuteStageAsync(
            ctx,
            "authority.findings",
            AuthorityPipelineStageNames.Findings,
            (_, token) => _findingsStage.ExecuteAsync(ctx, token),
            ct);

        await ExecuteStageAsync(
            ctx,
            "authority.decisioning",
            AuthorityPipelineStageNames.Decisioning,
            (_, token) => _decisioningStage.ExecuteAsync(ctx, token),
            ct);

        await ExecuteStageAsync(
            ctx,
            "authority.artifacts",
            AuthorityPipelineStageNames.Artifacts,
            (_, token) => _artifactsStage.ExecuteAsync(ctx, token),
            ct);
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
            {
                _logger.LogInformation(
                    "Authority pipeline state transition: RunId={RunId}, CurrentStage={CurrentStage}, NextStage={NextStage}",
                    ctx.Run.RunId,
                    stageName,
                    nextStage);
            }

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

            await stageWork(activity, ct);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Authority pipeline stage completed: RunId={RunId}, Stage={Stage}",
                    ctx.Run.RunId,
                    stageName);
            }
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

    private static string MapStageOutcomeStatus(string executorOutcome) =>
        executorOutcome switch
        {
            "success" => "succeeded",
            "error" => "failed",
            "skipped_checkpoint" => "skipped",
            _ => "failed",
        };
}
