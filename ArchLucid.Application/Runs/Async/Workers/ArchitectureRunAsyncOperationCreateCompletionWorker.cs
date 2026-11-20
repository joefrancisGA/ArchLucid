namespace ArchLucid.Application.Runs.Async.Workers;

public sealed class ArchitectureRunAsyncOperationCreateCompletionWorker : IArchitectureRunAsyncOperationCreateCompletionWorker
{
    internal const int MaxConcurrentCreateCompletions = 4;

    internal static readonly TimeSpan DefaultCreateWaitTimeout = TimeSpan.FromSeconds(60);

    private readonly SemaphoreSlim _createGate = new(MaxConcurrentCreateCompletions);
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
        try
        {
            await _createGate.WaitAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            try
            {
                await onCreateFailureAsync(item, CancellationToken.None);
            }
            finally
            {
                registrar.Release(item.Scope, item.RunId, item.Kind);
            }

            throw;
        }

        try
        {
            await processWorkItemAsync(item, cancellationToken);
        }
        finally
        {
            _createGate.Release();
        }
    }

    public async Task WaitForCreateIfNeededAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        IArchitectureRunAsyncOperationRegistrar registrar,
        CancellationToken cancellationToken)
    {
        Task? completion = registrar.GetReleaseTask(item.Scope, item.RunId, ArchitectureRunAsyncOperationKind.Create);
        if (completion is null)
            return;

        try
        {
            await completion.WaitAsync(_createWaitTimeout, cancellationToken);
        }
        catch (TimeoutException)
        {
            // Create worker may be stuck; execute can still resume a deferred pipeline.
        }
    }
}
