namespace ArchLucid.Application.Runs.Async.Workers;

public interface IArchitectureRunAsyncOperationExecuteReplayWorker
{
    Task ProcessExecuteOrReplayAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> processWorkItemAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> waitForCreateIfNeededAsync,
        Func<ArchitectureRunAsyncOperationWorkItem, OperationCanceledException, Task> onAdmissionCanceledAsync,
        CancellationToken cancellationToken);
}
