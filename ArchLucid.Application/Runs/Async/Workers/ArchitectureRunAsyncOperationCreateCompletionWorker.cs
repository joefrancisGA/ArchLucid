using System.Collections.Concurrent;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async.Workers;

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
