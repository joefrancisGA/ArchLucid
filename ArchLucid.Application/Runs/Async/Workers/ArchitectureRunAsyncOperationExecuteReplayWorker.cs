namespace ArchLucid.Application.Runs.Async.Workers;

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
