namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Hybrid realized-value metrics linking disposition workflow outcomes to executive ROI (Batch B / item 20).
///     Computed fields are derived from audit and disposition evidence; attestation fields are operator-entered.
/// </summary>
public sealed class RealizedValueSummary
{
    /// <summary>Findings dispositioned as remediated in the trailing 30-day window.</summary>
    public int FindingsRemediatedCount30Days
    {
        get;
        set;
    }

    /// <summary>Median days from first review event to remediated disposition (null when no samples).</summary>
    public double? MedianTimeToRemediationDays
    {
        get;
        set;
    }

    /// <summary>Active risk exceptions (waivers) for the tenant.</summary>
    public int ActiveWaiversCount
    {
        get;
        set;
    }

    /// <summary>Waivers revoked or expired in the trailing 30-day window.</summary>
    public int WaiversRetiredCount30Days
    {
        get;
        set;
    }

    /// <summary>Waivers that expired in the trailing 30-day window (underlying finding re-opened).</summary>
    public int WaiverExpiryReversionCount30Days
    {
        get;
        set;
    }

    /// <summary>Operator-attested incidents avoided (not computed).</summary>
    public int? AttestedIncidentsAvoided
    {
        get;
        set;
    }

    /// <summary>Operator-attested revenue or retention impact note (not computed).</summary>
    public string? AttestedRevenueOrRetentionImpact
    {
        get;
        set;
    }

    /// <summary>Operator-attested reviewer time saved note (not computed).</summary>
    public string? AttestedReviewerTimeSavedNote
    {
        get;
        set;
    }
}
