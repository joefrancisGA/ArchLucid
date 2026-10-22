using System.Collections.Concurrent;

namespace ArchLucid.Application.Runs.Async.Workers;

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
