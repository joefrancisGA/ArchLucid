using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Decides which active waivers deserve an expiry reminder on this pass (TB-2193). Pure by design: the scanner
///     owns I/O and idempotency, this owns the cadence decision so it can be tested without a database.
/// </summary>
public static class WaiverExpiryNotificationPlanner
{
    public static IReadOnlyList<WaiverExpiryNotification> Plan(
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(activeWaivers);

        List<WaiverExpiryNotification> planned = [];

        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (waiver is null)
                continue;

            // Revoked and already-expired waivers are settled: reminding about them would be noise, and the row
            // explicitly keeps expiry a human decision.
            if (waiver.Status != RiskExceptionStatus.Active)
                continue;

            int daysRemaining = WaiverExpiryNotificationBoundary.ResolveDaysRemaining(waiver.ExpiresAtUtc, nowUtc);

            int? boundary = WaiverExpiryNotificationBoundary.ResolveEnteredBoundary(
                daysRemaining,
                GovernanceWaiverExpiryWindow.AlertDayBoundaries);

            if (boundary is null)
                continue;

            planned.Add(
                new WaiverExpiryNotification
                {
                    Waiver = waiver,
                    BoundaryDays = boundary.Value,
                    DaysRemaining = daysRemaining,
                });
        }

        return planned;
    }
}
