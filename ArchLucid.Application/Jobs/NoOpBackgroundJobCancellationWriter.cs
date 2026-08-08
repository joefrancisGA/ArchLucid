namespace ArchLucid.Application.Jobs;

/// <summary>Worker hosts without a background job queue still expose operation cancel for runs.</summary>
public sealed class NoOpBackgroundJobCancellationWriter : IBackgroundJobCancellationWriter
{
    public Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
