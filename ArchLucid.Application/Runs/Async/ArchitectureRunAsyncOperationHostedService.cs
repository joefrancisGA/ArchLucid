using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async.Workers;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Async;

public sealed class ArchitectureRunAsyncOperationHostedService(
    IArchitectureRunAsyncOperationQueueDrainWorker drainWorker,
    IArchitectureRunAsyncOperationCreateCompletionWorker createCompletionWorker,
    IArchitectureRunAsyncOperationExecuteReplayWorker executeReplayWorker,
    IServiceScopeFactory scopeFactory,
    IArchitectureRunAsyncOperationRegistrar registrar,
    IOperationCancellationRegistry operationCancellationRegistry,
    ILogger<ArchitectureRunAsyncOperationHostedService> logger) : BackgroundService
{
    internal const int MaxConcurrentCreateCompletions = ArchitectureRunAsyncOperationCreateCompletionWorker.MaxConcurrentCreateCompletions;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await drainWorker.DrainAsync(DispatchAsync, stoppingToken);
                return;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Async run operation drain faulted; restarting.");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await base.StopAsync(cancellationToken);
        await drainWorker.DrainInFlightAsync();
    }

    private Task DispatchAsync(ArchitectureRunAsyncOperationWorkItem item, CancellationToken cancellationToken)
    {
        if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
        {
            return createCompletionWorker.ProcessCreateBoundedAsync(
                item,
                ProcessWorkItemAndReleaseAsync,
                TryMarkCreateFailedAsync,
                registrar,
                cancellationToken);
        }

        return executeReplayWorker.ProcessExecuteOrReplayAsync(
            item,
            ProcessWorkItemAndReleaseAsync,
            (workItem, ct) => createCompletionWorker.WaitForCreateIfNeededAsync(workItem, registrar, ct),
            cancellationToken);
    }

    private async Task ProcessWorkItemAndReleaseAsync(ArchitectureRunAsyncOperationWorkItem item, CancellationToken cancellationToken)
    {
        try
        {
            await ProcessWorkItemAsync(item, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Async run operation failed for run {RunId} kind {Kind}.", item.RunId, item.Kind);

            if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
                await TryMarkCreateFailedAsync(item, cancellationToken);
            else if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
                await TryMarkExecuteFailedAsync(item, ex, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
                await TryMarkCreateFailedAsync(item, CancellationToken.None);

            throw;
        }
        finally
        {
            registrar.Release(item.Scope, item.RunId, item.Kind);
        }
    }

    private async Task TryMarkCreateFailedAsync(ArchitectureRunAsyncOperationWorkItem item, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(item.RunId, out Guid runId))
            return;

        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
            RunRecord? header = await runs.GetByIdAsync(item.Scope, runId, cancellationToken);

            if (header is null)
                return;

            if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase)
                || string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Failed), StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            header.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed);
            header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
            header.LastFailureReason = "Async create worker failed before coordination completed.";
            await runs.UpdateAsync(header, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Failed to mark async create run {RunId} as Failed.", item.RunId);
        }
    }

    private async Task TryMarkExecuteFailedAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Exception fault,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(item.RunId, out Guid runId))
            return;

        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
            RunRecord? header = await runs.GetByIdAsync(item.Scope, runId, cancellationToken);

            if (header is null)
                return;

            if (string.Equals(
                    header.LegacyRunStatus,
                    nameof(ArchitectureRunStatus.Committed),
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            header.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed);
            header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
            header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(
                AgentExecutionFailureSummaryFactory.FromException(fault));
            await runs.UpdateAsync(header, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Failed to mark async execute run {RunId} as Failed.", item.RunId);
        }
    }

    private async Task ProcessWorkItemAsync(ArchitectureRunAsyncOperationWorkItem item, CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        using IDisposable _ = AmbientScopeContext.Push(item.Scope);

        string operationRunId = item.Kind == ArchitectureRunAsyncOperationKind.Replay
            ? item.PreparedReplayRunId ?? item.RunId
            : item.RunId;

        if (Guid.TryParse(operationRunId, out Guid parsedRunId))
        {
            string operationId = OperationIdCodec.ForRun(parsedRunId);

            if (operationCancellationRegistry.IsCancelRequested(item.Scope, operationId))
            {
                await scope.ServiceProvider
                    .GetRequiredService<OperationRunCancellationMarker>()
                    .TryMarkRunCanceledAsync(item.Scope, parsedRunId, cancellationToken);
                return;
            }
        }

        if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
        {
            if (!Guid.TryParse(item.RunId, out Guid executeRunGuid))
                throw new InvalidOperationException($"Execute work item run id '{item.RunId}' is not a valid GUID.");

            IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
            RunRecord? executeHeader = await runs.GetByIdAsync(item.Scope, executeRunGuid, cancellationToken);

            if (executeHeader is null)
            {
                throw new InvalidOperationException(
                    $"Execute blocked for run '{item.RunId}': run header was not found.");
            }

            RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow(
                item.Scope,
                executeHeader,
                item.RunId,
                "Execute");

            await scope.ServiceProvider
                .GetRequiredService<IArchitectureRunExecuteOrchestrator>()
                .ExecuteRunAsync(item.RunId, cancellationToken);
            return;
        }

        if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
        {
            if (item.CreateRequest is null)
                throw new InvalidOperationException("Create work item is missing CreateRequest.");

            if (!Guid.TryParseExact(item.RunId, "N", out Guid parsedCreateRunId)
                && !Guid.TryParse(item.RunId, out parsedCreateRunId))
            {
                throw new InvalidOperationException($"Create work item run id '{item.RunId}' is not a valid GUID.");
            }

            IRunRepository createRuns = scope.ServiceProvider.GetRequiredService<IRunRepository>();
            RunRecord? createHeader = await createRuns.GetByIdAsync(item.Scope, parsedCreateRunId, cancellationToken);

            if (createHeader is null)
            {
                throw new InvalidOperationException(
                    $"Create blocked for run '{item.RunId}': run header was not found.");
            }

            RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow(
                item.Scope,
                createHeader,
                item.RunId,
                "Create");

            await scope.ServiceProvider
                .GetRequiredService<IArchitectureRunCreateOrchestrator>()
                .CompleteAsyncAcceptedCreateRunAsync(
                    parsedCreateRunId,
                    item.CreateRequest,
                    item.CreateIdempotency,
                    cancellationToken,
                    item.Actor);
            return;
        }

        if (string.IsNullOrWhiteSpace(item.PreparedReplayRunId))
            throw new InvalidOperationException("Replay work item is missing PreparedReplayRunId.");

        if (!Guid.TryParse(item.RunId, out Guid replaySourceRunGuid))
        {
            throw new InvalidOperationException(
                $"Replay blocked for run '{item.RunId}': source run id is not a valid GUID.");
        }

        IRunRepository replayRuns = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? replaySourceHeader = await replayRuns.GetByIdAsync(item.Scope, replaySourceRunGuid, cancellationToken);

        if (replaySourceHeader is null)
        {
            throw new InvalidOperationException(
                $"Replay blocked for run '{item.RunId}': source run header was not found.");
        }

        ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow(item.Scope, replaySourceHeader, item.RunId);

        await scope.ServiceProvider
            .GetRequiredService<IReplayRunService>()
            .ExecutePreparedReplayAsync(
                item.PreparedReplayRunId,
                item.RunId,
                item.ReplayExecutionMode ?? ExecutionModes.Current,
                item.ReplayCommit,
                item.ReplayManifestVersionOverride,
                cancellationToken);
    }
}
