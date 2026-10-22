namespace ArchLucid.Application.Governance;

/// <summary>Wave-32 suggestion 378: threshold scanning for compliance drift escalation integration events.</summary>
public sealed class ComplianceDriftEscalationOptions
{
    public const string SectionName = "ComplianceDriftEscalation";

    /// <summary>When false, the scanner no-ops (hosted service still polls).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Leader-elected scan cadence; default 6 hours.</summary>
    public int ScanIntervalHours
    {
        get;
        set;
    } = 6;

    /// <summary>
    ///     Optional open-findings activity threshold for the rolling 24-hour bucket. When null, the metric is skipped.
    /// </summary>
    public int? OpenFindingsCountThreshold
    {
        get;
        set;
    }

    /// <summary>
    ///     Hours since the latest scoped policy-pack change before <see cref="ComplianceDriftEscalationMetricKeys.PolicyPackStaleHours" />
    ///     escalation. When null, the metric is skipped.
    /// </summary>
    public double? PolicyPackStaleHoursThreshold
    {
        get;
        set;
    } = 72d;
}
