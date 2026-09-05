using System.Collections.Concurrent;
using ArchLucid.Core.Scoping;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Runs.Async.Workers;

public interface IArchitectureRunAsyncOperationQueueDrainWorker
{
    Task DrainAsync(Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> dispatchAsync, CancellationToken stoppingToken);
    Task DrainInFlightAsync();
}

public sealed class ArchitectureRunAsyncOperationQueueDrainWorker(ArchitectureRunAsyncOperationQueue queue) : IArchitectureRunAsyncOperationQueueDrainWorker
{
    private readonly ConcurrentDictionary<Guid, Task> _inFlight = new();

    public async Task DrainAsync(Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> dispatchAsync, CancellationToken stoppingToken)
    {
        try
        {
            await foreach (ArchitectureRunAsyncOperationWorkItem item in queue.Reader.ReadAllAsync(stoppingToken))
                Track(dispatchAsync(item, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }

        await DrainInFlightAsync();
    }

    public async Task DrainInFlightAsync()
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
        }
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
}

public interface IArchitectureRunAsyncOperationCreateCompletionWorker
{
    Task ProcessCreateBoundedAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> onCreateFailureAsync,
        IArchitectureRunAsyncOperationRegistrar registrar,
        CancellationToken cancellationToken);

    Task WaitForCreateIfNeededAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        IArchitectureRunAsyncOperationRegistrar registrar,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunAsyncOperationCreateCompletionWorker : IArchitectureRunAsyncOperationCreateCompletionWorker
{
    internal const int MaxConcurrentCreateCompletions = 4;

    internal static readonly TimeSpan DefaultCreateWaitTimeout = TimeSpan.FromSeconds(60);

    private readonly SemaphoreSlim _createGate = new(MaxConcurrentCreateCompletions);
    private readonly ConcurrentDictionary<string, TaskCompletionSource> _createCompleted = new(StringComparer.Ordinal);
    private readonly TimeSpan _createWaitTimeout;

    public ArchitectureRunAsyncOperationCreateCompletionWorker()
        : this(DefaultCreateWaitTimeout)
    {
    }

    internal ArchitectureRunAsyncOperationCreateCompletionWorker(TimeSpan createWaitTimeout)
    {
        _createWaitTimeout = createWaitTimeout <= TimeSpan.Zero
            ? DefaultCreateWaitTimeout
            : createWaitTimeout;
    }

    public async Task ProcessCreateBoundedAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> onCreateFailureAsync,
        IArchitectureRunAsyncOperationRegistrar registrar,
        CancellationToken cancellationToken)
    {
        TaskCompletionSource completion = GetCreateCompletion(item);

        try
        {
            await _createGate.WaitAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            await onCreateFailureAsync(item, cancellationToken);
            registrar.Release(item.Scope, item.RunId, item.Kind);
            completion.TrySetResult();
            throw;
        }

        try
        {
            await processWorkItemAsync(item, cancellationToken);
        }
        finally
        {
            _createGate.Release();
            completion.TrySetResult();
        }
    }

    public async Task WaitForCreateIfNeededAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        IArchitectureRunAsyncOperationRegistrar registrar,
        CancellationToken cancellationToken)
    {
        if (!registrar.IsRegistered(item.Scope, item.RunId, ArchitectureRunAsyncOperationKind.Create))
            return;

        try
        {
            await GetCreateCompletion(item).Task.WaitAsync(_createWaitTimeout, cancellationToken);
        }
        catch (TimeoutException)
        {
            // Create worker may be stuck; execute can still resume a deferred pipeline.
        }
    }

    private TaskCompletionSource GetCreateCompletion(ArchitectureRunAsyncOperationWorkItem item) =>
        _createCompleted.GetOrAdd(
            BuildKey(item.Scope, item.RunId),
            static _ => new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously));

    private static string BuildKey(ScopeContext scope, string runId)
    {
        string normalized = Guid.TryParse(runId, out Guid parsed) ? parsed.ToString("N") : runId;
        return $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{normalized}";
    }
}

public interface IArchitectureRunAsyncOperationExecuteReplayWorker
{
    Task ProcessExecuteOrReplayAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> waitForCreateIfNeededAsync,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunAsyncOperationExecuteReplayWorker : IArchitectureRunAsyncOperationExecuteReplayWorker
{
    internal const int MaxConcurrentExecuteReplays = 4;

    private readonly SemaphoreSlim _gate = new(MaxConcurrentExecuteReplays);

    public async Task ProcessExecuteOrReplayAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> waitForCreateIfNeededAsync,
        CancellationToken cancellationToken)
    {
        if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
            await waitForCreateIfNeededAsync(item, cancellationToken);

        await _gate.WaitAsync(cancellationToken);

        try
        {
            await processWorkItemAsync(item, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }
}

public static class ArchitectureRunAsyncOperationWorkerServiceCollectionExtensions
{
    public static IServiceCollection AddArchitectureRunAsyncOperationWorkers(this IServiceCollection services)
    {
        services.AddSingleton<IArchitectureRunAsyncOperationQueueDrainWorker, ArchitectureRunAsyncOperationQueueDrainWorker>();
        services.AddSingleton<IArchitectureRunAsyncOperationCreateCompletionWorker, ArchitectureRunAsyncOperationCreateCompletionWorker>();
        services.AddSingleton<IArchitectureRunAsyncOperationExecuteReplayWorker, ArchitectureRunAsyncOperationExecuteReplayWorker>();
        return services;
    }
}
