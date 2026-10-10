namespace ArchLucid.Application.Runs.Async.Workers;

public interface IArchitectureRunAsyncOperationQueueDrainWorker
{
    Task DrainAsync(Func<ArchitectureRunAsyncOperationWorkItem, CancellationToken, Task> dispatchAsync, CancellationToken stoppingToken);
    Task DrainInFlightAsync();
}
