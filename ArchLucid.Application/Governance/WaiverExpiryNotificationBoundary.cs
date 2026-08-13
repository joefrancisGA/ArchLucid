namespace ArchLucid.Application.Governance;

/// <summary>
///     Maps a waiver's remaining lifetime onto the escalating reminder boundaries in
///     <see cref="GovernanceWaiverExpiryWindow.AlertDayBoundaries" /> (TB-2193).
/// </summary>
public static class WaiverExpiryNotificationBoundary
{
    /// <summary>
    ///     Whole days from <paramref name="nowUtc" /> to <paramref name="expiresAtUtc" />, truncated to UTC calendar
    ///     days. Truncating means every pass on the same day computes the same value, so a scanner that runs twice in
    ///     one day cannot land on two different boundaries for the same waiver. Negative when already past expiry.
    /// </summary>
    public static int ResolveDaysRemaining(DateTimeOffset expiresAtUtc, DateTimeOffset nowUtc)
    {
        TimeSpan difference = expiresAtUtc.UtcDateTime.Date - nowUtc.UtcDateTime.Date;

        return (int)difference.TotalDays;
    }

    /// <summary>
    ///     Returns the tightest boundary the waiver has entered, or <see langword="null" /> when expiry is still
    ///     further out than the widest boundary.
    ///     <para>
    ///         Deliberately "tightest entered" rather than an exact day match: an exact match would silently skip a
    ///         reminder whenever the scanner was down on the boundary day itself. With 30/14/7/0 boundaries, a waiver
    ///         seen at 12 days remaining reports boundary 14, so the reminder still goes out one day late instead of
    ///         never.
    ///     </para>
    /// </summary>
    public static int? ResolveEnteredBoundary(int daysRemaining, IReadOnlyList<int> boundaries)
    {
        ArgumentNullException.ThrowIfNull(boundaries);

        int? tightest = null;

        foreach (int boundary in boundaries)
        {
            if (daysRemaining > boundary)
                continue;

            if (tightest is null || boundary < tightest.Value)
                tightest = boundary;
        }

        return tightest;
    }
}
