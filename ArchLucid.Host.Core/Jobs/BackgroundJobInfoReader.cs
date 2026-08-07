using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>Adapts <see cref="IBackgroundJobQueue" /> for application-layer read projections.</summary>
public sealed class BackgroundJobInfoReader(IBackgroundJobQueue queue) : IBackgroundJobInfoReader
{
  private readonly IBackgroundJobQueue _queue = queue ?? throw new ArgumentNullException(nameof(queue));

  public Task<BackgroundJobInfo?> GetInfoAsync(string jobId, CancellationToken cancellationToken = default) =>
    _queue.GetInfoAsync(jobId, cancellationToken);
}
