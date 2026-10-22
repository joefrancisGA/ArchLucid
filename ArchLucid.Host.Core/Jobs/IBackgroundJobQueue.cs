using ArchLucid.Application.Jobs;

namespace ArchLucid.Host.Core.Jobs;

public interface IBackgroundJobQueue
{
    Task<string> EnqueueAsync(
        BackgroundJobWorkUnit workUnit,
        int maxRetries = 0,
        CancellationToken cancellationToken = default);

    Task<BackgroundJobInfo?> GetInfoAsync(string jobId, CancellationToken cancellationToken = default);

    Task<BackgroundJobFile?> GetFileAsync(string jobId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Returns the serialized work unit for tenant-scope authorization on poll/download (TB-2073).
    /// </summary>
    Task<BackgroundJobWorkUnit?> TryGetWorkUnitAsync(string jobId, CancellationToken cancellationToken = default);

    Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default);
}
