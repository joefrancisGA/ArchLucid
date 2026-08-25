using System.Collections.Concurrent;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Async;

/// <summary>
///     Drains the async run queue without blocking create behind execute/replay.
///     Create completions are bounded; execute waits until create for the same run finishes.
/// </summary>
public sealed class ArchitectureRunAsyncOperationHostedService(
    ArchitectureRunAsyncOperationQueue queue,
    IServiceScopeFactory scopeFactory,
    IArchitectureRunAsyncOperationRegistrar registrar,
    IOperationCancellationRegistry operationCancellationRegistry,
    ILogger<ArchitectureRunAsyncOperationHostedService> logger) : BackgroundService
{
    internal const int MaxConcurrentCreateCompletions = 4;

    private readonly ArchitectureRunAsyncOperationQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IArchitectureRunAsyncOperationRegistrar _registrar =
        registrar ?? throw new ArgumentNullException(nameof(registrar));

    private readonly IOperationCancellationRegistry _operationCancellationRegistry =
        operationCancellationRegistry ?? throw new ArgumentNullException(nameof(operationCancellationRegistry));

    private readonly ILogger<ArchitectureRunAsyncOperationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly SemaphoreSlim _createGate = new(MaxConcurrentCreateCompletions);
    private readonly SemaphoreSlim _executeReplayGate = new(1);
    private readonly ConcurrentDictionary<Guid, Task> _inFlight = new();
    private readonly ConcurrentDictionary<string, TaskCompletionSource> _createCompleted = new(StringComparer.Ordinal);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (ArchitectureRunAsyncOperationWorkItem item in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                Track(DispatchAsync(item, stoppingToken));
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }

        await DrainInFlightAsync();
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await base.StopAsync(cancellationToken);
        await DrainInFlightAsync();
    }

    public override void Dispose()
    {
        _createGate.Dispose();
        _executeReplayGate.Dispose();
        base.Dispose();
    }

    private Task DispatchAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
            return ProcessCreateBoundedAsync(item, cancellationToken);

        return ProcessExecuteOrReplayAsync(item, cancellationToken);
    }

    private async Task ProcessCreateBoundedAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        TaskCompletionSource completion = GetCreateCompletion(item);

        try
        {
            await _createGate.WaitAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            await TryMarkCreateFailedAsync(item, cancellationToken);
            _registrar.Release(item.Scope, item.RunId, item.Kind);
            completion.TrySetResult();
            throw;
        }

        try
        {
            await ProcessWorkItemAndReleaseAsync(item, cancellationToken);
        }
        finally
        {
            _createGate.Release();
            completion.TrySetResult();
        }
    }

    private async Task ProcessExecuteOrReplayAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
            await WaitForCreateIfNeededAsync(item, cancellationToken);

        await _executeReplayGate.WaitAsync(cancellationToken);

        try
        {
            await ProcessWorkItemAndReleaseAsync(item, cancellationToken);
        }
        finally
        {
            _executeReplayGate.Release();
        }
    }

    private async Task WaitForCreateIfNeededAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        string key = BuildCreateCompletionKey(item.Scope, item.RunId);
        bool createInFlight = _registrar.IsRegistered(
            item.Scope,
            item.RunId,
            ArchitectureRunAsyncOperationKind.Create);

        if (!createInFlight && !_createCompleted.ContainsKey(key))
            return;

        TaskCompletionSource completion = GetCreateCompletion(item);
        await completion.Task.WaitAsync(cancellationToken);
    }

    private TaskCompletionSource GetCreateCompletion(
        ArchitectureRunAsyncOperationWorkItem item)
    {
        string key = BuildCreateCompletionKey(item.Scope, item.RunId);

        return _createCompleted.GetOrAdd(
            key,
            static _ => new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously));
    }

    private static string BuildCreateCompletionKey(ScopeContext scope, string runId)
    {
        string normalized = Guid.TryParse(runId, out Guid parsed) ? parsed.ToString("N") : runId;

        return $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{normalized}";
    }

    private void Track(Task task)
    {
        Guid id = Guid.NewGuid();
        _inFlight[id] = task;
        _ = task.ContinueWith(
            static (completed, state) =>
            {
                (ConcurrentDictionary<Guid, Task> inFlight, Guid trackedId) =
                    ((ConcurrentDictionary<Guid, Task>, Guid))state!;
                inFlight.TryRemove(trackedId, out _);
                _ = completed.Exception;
            },
            (_inFlight, id),
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }

    private async Task DrainInFlightAsync()
    {
        Task[] tasks = _inFlight.Values.ToArray();

        if (tasks.Length == 0)
            return;

        try
        {
            await Task.WhenAll(tasks);
        }
        catch (Exception) when (tasks.All(static t => t.IsCompleted))
        {
            // Observed via WhenAll; individual processors already logged failures.
        }
    }

    private async Task ProcessWorkItemAndReleaseAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        try
        {
            await ProcessWorkItemAsync(item, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(
                ex,
                "Async run operation failed for run {RunId} kind {Kind}.",
                item.RunId,
                item.Kind);

            if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
                await TryMarkCreateFailedAsync(item, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
                await TryMarkCreateFailedAsync(item, CancellationToken.None);

            throw;
        }
        finally
        {
            _registrar.Release(item.Scope, item.RunId, item.Kind);
        }
    }

    private async Task TryMarkCreateFailedAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(item.RunId, out Guid runId))
            return;

        try
        {
            await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
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

            if (string.Equals(
                    header.LegacyRunStatus,
                    nameof(ArchitectureRunStatus.Failed),
                    StringComparison.OrdinalIgnoreCase))
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
            _logger.LogWarning(
                ex,
                "Failed to mark async create run {RunId} as Failed.",
                item.RunId);
        }
    }

    private async Task ProcessWorkItemAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

        using IDisposable _ = AmbientScopeContext.Push(item.Scope);

        string operationRunId = item.Kind == ArchitectureRunAsyncOperationKind.Replay
            ? item.PreparedReplayRunId ?? item.RunId
            : item.RunId;

        if (Guid.TryParse(operationRunId, out Guid parsedRunId))
        {
            string operationId = OperationIdCodec.ForRun(parsedRunId);

            if (_operationCancellationRegistry.IsCancelRequested(item.Scope, operationId))
            {
                OperationRunCancellationMarker runCancellationMarker =
                    scope.ServiceProvider.GetRequiredService<OperationRunCancellationMarker>();

                await runCancellationMarker.TryMarkRunCanceledAsync(item.Scope, parsedRunId, cancellationToken);

                return;
            }
        }

        if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
        {
            IArchitectureRunExecuteOrchestrator orchestrator =
                scope.ServiceProvider.GetRequiredService<IArchitectureRunExecuteOrchestrator>();

            await orchestrator.ExecuteRunAsync(item.RunId, cancellationToken);

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

            IArchitectureRunCreateOrchestrator createOrchestrator =
                scope.ServiceProvider.GetRequiredService<IArchitectureRunCreateOrchestrator>();

            await createOrchestrator.CompleteAsyncAcceptedCreateRunAsync(
                parsedCreateRunId,
                item.CreateRequest,
                item.CreateIdempotency,
                cancellationToken,
                item.Actor);

            return;
        }

        IReplayRunService replayRunService = scope.ServiceProvider.GetRequiredService<IReplayRunService>();

        if (string.IsNullOrWhiteSpace(item.PreparedReplayRunId))
            throw new InvalidOperationException("Replay work item is missing PreparedReplayRunId.");

        await replayRunService.ExecutePreparedReplayAsync(
            item.PreparedReplayRunId,
            item.RunId,
            item.ReplayExecutionMode ?? ExecutionModes.Current,
            item.ReplayCommit,
            item.ReplayManifestVersionOverride,
            cancellationToken);
    }
}
