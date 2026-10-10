namespace ArchLucid.Application.Runs.Async.Workers;

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
