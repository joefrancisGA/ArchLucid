using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Jobs;

public sealed class BackgroundJobCancellationWriter(IBackgroundJobQueue queue) : IBackgroundJobCancellationWriter
{
    private readonly IBackgroundJobQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    public Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default) =>
        _queue.MarkCanceledAsync(jobId, cancellationToken);
}
