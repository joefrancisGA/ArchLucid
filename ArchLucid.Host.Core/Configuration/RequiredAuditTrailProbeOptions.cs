namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     TB-955: periodic probe for domain rows missing expected Required audit events (INV-003).
/// </summary>
public sealed class RequiredAuditTrailProbeOptions
{
    public const string SectionName = "RequiredAuditTrail";

    /// <summary>When false, hosted probe and job no-op.</summary>
    public bool OrphanProbeEnabled { get; set; } = true;

    /// <summary>Cadence between probe passes (clamped 5–1440 minutes).</summary>
    public int OrphanProbeIntervalMinutes { get; set; } = 60;

    /// <summary>
    ///     Domain rows newer than this many minutes are skipped (dual-write lag grace after TB-953 fail-closed).
    /// </summary>
    public int OrphanProbeGraceMinutes { get; set; } = 15;

    /// <summary>Only inspect domain rows created/reviewed within this many days (bounds scan cost).</summary>
    public int OrphanProbeLookbackDays { get; set; } = 7;
}
