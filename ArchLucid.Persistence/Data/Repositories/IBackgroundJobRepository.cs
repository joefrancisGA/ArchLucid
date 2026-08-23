namespace ArchLucid.Persistence.Data.Repositories;

public interface IBackgroundJobRepository
{
    Task InsertAsync(BackgroundJobRow row, CancellationToken cancellationToken = default);

    Task<BackgroundJobRow?> GetAsync(string jobId, CancellationToken cancellationToken = default);

    /// <summary>Sets state to Running when currently Pending. Returns rows affected (1 if claimed).</summary>
    Task<int> TryMarkRunningAsync(string jobId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Under <c>READ COMMITTED</c> + <c>UPDLOCK, ROWLOCK</c>, reads the job row and either deletes the queue message
    ///     logically
    ///     (unknown/terminal/running duplicate), claims <c>Pending</c> by moving to <c>Running</c>, or leaves the message for
    ///     retry.
    /// </summary>
    Task<QueuedBackgroundJobPrepareResult> TryPrepareQueuedJobAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    Task MarkSucceededAsync(
        string jobId,
        string resultBlobName,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task MarkFailedTerminalAsync(
        string jobId,
        string error,
        int retryCount,
        CancellationToken cancellationToken = default);

    Task MarkPendingRetryAsync(
        string jobId,
        int retryCount,
        string error,
        CancellationToken cancellationToken = default);

    Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default);

    Task<int> CountNonTerminalAsync(CancellationToken cancellationToken = default);

    /// <summary>
    ///     Reclaims stale <see cref="BackgroundJobRow.State"/> = <c>Running</c> rows missed when a worker vanished.
    ///     Moves eligible rows to <c>Pending</c> (increments retries, clears <see cref="BackgroundJobRow.StartedUtc"/>)
    ///     and marks exhausted rows <c>Failed</c>. Returns job ids moved to <c>Pending</c> for queue re-notification.
    /// </summary>
    Task<IReadOnlyList<string>> ResetStaleRunningJobsOlderThanAsync(
        TimeSpan maxRunningAge,
        CancellationToken cancellationToken = default);
}
