using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Delegates to <see cref="IBackgroundJobQueue.TryGetWorkUnitAsync" /> so Application stays host-agnostic.
/// </summary>
public sealed class BackgroundJobWorkUnitAccessor(IBackgroundJobQueue jobQueue) : IBackgroundJobWorkUnitAccessor
{
    private readonly IBackgroundJobQueue _jobQueue =
        jobQueue ?? throw new ArgumentNullException(nameof(jobQueue));

    public Task<BackgroundJobWorkUnit?> TryGetAsync(string jobId, CancellationToken cancellationToken = default) =>
        _jobQueue.TryGetWorkUnitAsync(jobId, cancellationToken);
}
