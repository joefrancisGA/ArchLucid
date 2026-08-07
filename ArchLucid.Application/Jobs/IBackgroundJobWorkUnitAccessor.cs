namespace ArchLucid.Application.Jobs;

/// <summary>
///     Reads serialized work units for tenant-scope authorization on job poll/download (TB-2073).
/// </summary>
public interface IBackgroundJobWorkUnitAccessor
{
    Task<BackgroundJobWorkUnit?> TryGetAsync(string jobId, CancellationToken cancellationToken = default);
}
