using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Runs.Async.Workers;

internal static class ArchitectureRunAsyncOperationWorkerServiceCollectionExtensions
{
    public static IServiceCollection AddArchitectureRunAsyncOperationWorkers(this IServiceCollection services)
    {
        services.AddSingleton<IArchitectureRunAsyncOperationQueueDrainWorker, ArchitectureRunAsyncOperationQueueDrainWorker>();
        services.AddSingleton<IArchitectureRunAsyncOperationCreateCompletionWorker, ArchitectureRunAsyncOperationCreateCompletionWorker>();
        services.AddSingleton<IArchitectureRunAsyncOperationExecuteReplayWorker, ArchitectureRunAsyncOperationExecuteReplayWorker>();
        return services;
    }
}
