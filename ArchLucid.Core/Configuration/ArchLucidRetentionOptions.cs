namespace ArchLucid.Core.Configuration;

/// <summary>
///     Cross-cutting retention knobs (<c>ArchLucid:Retention</c>) — data minimization and SQL hygiene independent of
///     subsystem-specific archival flags.
/// </summary>
public sealed class ArchLucidRetentionOptions
{
    public const string SectionPath = "ArchLucid:Retention";

    /// <summary>
    ///     Maximum age in days for <c>dbo.FirstTenantFunnelEvents</c> rows in SQL before archival or hard purge.
    ///     When <c>&lt;= 0</c>, callers fall back to <see cref="FirstTenantFunnelOptions.ArchivalRetentionDays" />.
    /// </summary>
    public int FunnelEventsDays
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" /> and blob archival is unavailable, aged funnel rows are deleted from SQL without
    ///     cold storage (privacy-first deployments). When <see langword="false" />, missing blob skips the cycle (legacy
    ///     behavior).
    /// </summary>
    public bool FunnelEventsHardDeleteWithoutBlobArchive
    {
        get;
        set;
    } = true;
}
