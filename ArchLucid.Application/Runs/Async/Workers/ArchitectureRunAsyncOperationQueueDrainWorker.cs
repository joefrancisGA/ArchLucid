using System.Collections.Concurrent;

namespace ArchLucid.Application.Runs.Async.Workers;

public sealed class ArchitectureRunAsyncOperationQueueDrainWorker(ArchitectureRunAsyncOperationQueue queue) : IArchitectureRunAsyncOperationQueueDrainWorker
{
    private const int MaxInFlightDispatches = 64;

    private readonly ConcurrentDictionary<Guid, Task> _inFlight = new();
    private readonly SemaphoreSlim _dispatchSlots = new(MaxInFlightDispatches);

    public async Task DrainAsync(Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> dispatchAsync, CancellationToken stoppingToken)
    {
        try
        {
            while (await queue.Reader.WaitToReadAsync(stoppingToken))
            {
                // Leave work in the bounded channel until the drain can track it.
                await _dispatchSlots.WaitAsync(stoppingToken);

                if (!queue.Reader.TryRead(out ArchitectureRunAsyncOperationWorkItem? item))
                {
                    _dispatchSlots.Release();
                    continue;
                }

                try
                {
                    Track(dispatchAsync(item, stoppingToken));
                }
                catch
                {
                    _dispatchSlots.Release();
                    throw;
                }
            }
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
                (ArchitectureRunAsyncOperationQueueDrainWorker worker, Guid trackedId) =
                    ((ArchitectureRunAsyncOperationQueueDrainWorker, Guid))state!;
                worker._inFlight.TryRemove(trackedId, out _);
                _ = completed.Exception;
                worker._dispatchSlots.Release();
            },
            (this, id),
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }
}
