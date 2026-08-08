namespace ArchLucid.Application.Jobs;

/// <summary>Cooperative cancel for queued background exports (TB-2076).</summary>
public interface IBackgroundJobCancellationWriter
{
    Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default);
}
