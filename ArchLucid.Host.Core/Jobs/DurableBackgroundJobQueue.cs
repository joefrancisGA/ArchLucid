using ArchLucid.Host.Core.Configuration;
using ArchLucid.Application.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Jobs;

public sealed class DurableBackgroundJobQueue(
    IBackgroundJobRepository repository,
    IBackgroundJobQueueNotifySender notifySender,
    IBackgroundJobResultBlobAccessor resultBlobs,
    IOptions<BackgroundJobsOptions> options) : IBackgroundJobQueue
{
    public async Task<string> EnqueueAsync(
        BackgroundJobWorkUnit workUnit,
        int maxRetries = 0,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(workUnit);

        BackgroundJobsOptions snapshot = options.Value;
        int safeMaxRetries = Math.Clamp(maxRetries, 0, 10);

        string jobId = Guid.NewGuid().ToString("N");
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        string workJson = BackgroundJobWorkUnitJson.Serialize(workUnit);

        BackgroundJobRow row = new()
        {
            JobId = jobId,
            WorkUnitJson = workJson,
            State = nameof(BackgroundJobState.Pending),
            CreatedUtc = now,
            StartedUtc = null,
            CompletedUtc = null,
            Error = null,
            FileName = null,
            ContentType = null,
            RetryCount = 0,
            MaxRetries = safeMaxRetries,
            ResultBlobName = null
        };

        if (!await repository.TryInsertPendingJobIfUnderCapacityAsync(row, snapshot.MaxPendingJobs, cancellationToken))
        {
            throw new InvalidOperationException(
                $"The background job queue is at capacity ({snapshot.MaxPendingJobs} non-terminal jobs). Try again later.");
        }

        try
        {
            await notifySender.SendJobIdAsync(jobId, cancellationToken);
        }
        catch (Exception ex)
        {
            await repository.MarkFailedTerminalAsync(
                jobId,
                $"Queue notification failed: {ex.Message}",
                retryCount: 0,
                cancellationToken);

            throw;
        }

        return jobId;
    }

    public async Task<BackgroundJobInfo?> GetInfoAsync(string jobId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return null;

        BackgroundJobRow? row = await repository.GetAsync(jobId, cancellationToken);

        return BackgroundJobPersistenceMapper.ToInfo(row);
    }

    public async Task<BackgroundJobFile?> GetFileAsync(string jobId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return null;

        BackgroundJobRow? row = await repository.GetAsync(jobId, cancellationToken);

        if (row is null || string.IsNullOrWhiteSpace(row.ResultBlobName) || string.IsNullOrWhiteSpace(row.FileName) ||
            string.IsNullOrWhiteSpace(row.ContentType))
            return null;

        return await resultBlobs.DownloadAsync(row.ResultBlobName, row.FileName, row.ContentType, cancellationToken);
    }

    public async Task<BackgroundJobWorkUnit?> TryGetWorkUnitAsync(string jobId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return null;

        BackgroundJobRow? row = await repository.GetAsync(jobId, cancellationToken);

        if (row is null || string.IsNullOrWhiteSpace(row.WorkUnitJson))
            return null;

        return BackgroundJobWorkUnitJson.TryDeserialize(row.WorkUnitJson);
    }

    public Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default) =>
        repository.MarkCanceledAsync(jobId, cancellationToken);
}
