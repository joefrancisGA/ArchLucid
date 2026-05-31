using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Canonical UTC inclusive window for active waivers expiring within N days (TB-104, TB-149).
///     Bounds: <c>[nowUtc, nowUtc + days]</c> — expired waivers before <paramref name="nowUtc" /> are excluded.
/// </summary>
public static class GovernanceWaiverExpiryWindow
{
    public const int DefaultExpiringWithinDays = 14;

    public static int CountExpiringWithinDays(
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        DateTimeOffset nowUtc,
        int days = DefaultExpiringWithinDays)
    {
        if (days < 0)
            throw new ArgumentOutOfRangeException(nameof(days), "Days must be non-negative.");

        if (activeWaivers.Count == 0)
            return 0;

        DateTimeOffset windowEnd = nowUtc.AddDays(days);

        int count = 0;

        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (waiver.ExpiresAtUtc >= nowUtc && waiver.ExpiresAtUtc <= windowEnd)
                count++;
        }

        return count;
    }
}
