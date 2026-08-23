namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Eligibility for reclaiming stale <c>Running</c> background jobs after worker loss.</summary>
public static class BackgroundJobStaleRunningReclaimPolicy
{
    /// <summary>
    ///     Returns whether a stale <c>Running</c> row should be moved back to <c>Pending</c> instead of terminal failure.
    ///     <see cref="BackgroundJobRow.MaxRetries" /> of zero still allows one crash reclaim when
    ///     <see cref="BackgroundJobRow.RetryCount" /> is zero (default export jobs).
    /// </summary>
    public static bool IsEligibleForPendingReclaim(int retryCount, int maxRetries)
    {
        if (retryCount < maxRetries)
            return true;

        if (maxRetries == 0 && retryCount == 0)
            return true;

        return false;
    }
}
