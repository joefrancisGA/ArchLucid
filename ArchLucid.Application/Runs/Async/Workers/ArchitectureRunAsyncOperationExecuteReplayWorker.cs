namespace ArchLucid.Application.Runs.Async.Workers;

public sealed class ArchitectureRunAsyncOperationExecuteReplayWorker : IArchitectureRunAsyncOperationExecuteReplayWorker
{
    internal const int MaxConcurrentExecuteReplays = 4;

    private readonly SemaphoreSlim _gate = new(MaxConcurrentExecuteReplays);

    public async Task ProcessExecuteOrReplayAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> waitForCreateIfNeededAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, OperationCanceledException, Task> onAdmissionCanceledAsync,
        CancellationToken cancellationToken)
    {
        try
        {
            if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
                await waitForCreateIfNeededAsync(item, cancellationToken);

            await _gate.WaitAsync(cancellationToken);
        }
        catch (OperationCanceledException ex) when (cancellationToken.IsCancellationRequested)
        {
            await onAdmissionCanceledAsync(item, ex);
            throw;
        }

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
