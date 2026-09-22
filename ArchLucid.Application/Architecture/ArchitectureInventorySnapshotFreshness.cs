namespace ArchLucid.Application.Architecture;

/// <summary>
///     AS-052 stale threshold for a bound Azure inventory snapshot.
///     Warn only — never auto-collect a replacement snapshot.
/// </summary>
public static class ArchitectureInventorySnapshotFreshness
{
    /// <summary>
    ///     Snapshots whose <c>CapturedUtc</c> is this old (or older) are labeled stale on the Working desk
    ///     and career export. Seven days matches inventory collection cadence; ROI cost-evidence uses a longer window.
    /// </summary>
    public static readonly TimeSpan StaleAfter = TimeSpan.FromDays(7);

    public const int StaleAfterDays = 7;

    public static bool IsStale(DateTime? capturedUtc, DateTime utcNow)
    {
        if (capturedUtc is null)
        {
            return false;
        }

        DateTime captured = capturedUtc.Value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(capturedUtc.Value, DateTimeKind.Utc)
            : capturedUtc.Value.ToUniversalTime();

        DateTime now = utcNow.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(utcNow, DateTimeKind.Utc)
            : utcNow.ToUniversalTime();

        return now - captured >= StaleAfter;
    }
}
