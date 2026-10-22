namespace ArchLucid.Application.Jobs;

/// <summary>Read-only access to background job status for operation projection (TB-2074).</summary>
public interface IBackgroundJobInfoReader
{
  Task<BackgroundJobInfo?> GetInfoAsync(string jobId, CancellationToken cancellationToken = default);
}
