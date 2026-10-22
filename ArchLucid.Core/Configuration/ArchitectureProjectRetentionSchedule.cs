namespace ArchLucid.Core.Configuration;

/// <summary>
///     Computes recycle-bin purge deadlines from <see cref="ArchitectureProjectRetentionPurgeOptions.RetentionDays" />.
/// </summary>
public static class ArchitectureProjectRetentionSchedule
{
    /// <summary>Matches purge worker clamp in <c>ArchitectureProjectRetentionPurgeBackgroundWork</c>.</summary>
    public static int ClampRetentionDays(int retentionDays) => Math.Clamp(retentionDays, 1, 365);

    /// <summary>Earliest UTC instant a soft-deleted row becomes eligible for hard purge.</summary>
    public static DateTimeOffset ComputePurgeAfterUtc(DateTimeOffset deletedUtc, int retentionDays)
    {
        int days = ClampRetentionDays(retentionDays);

        return deletedUtc.AddDays(days);
    }
}
