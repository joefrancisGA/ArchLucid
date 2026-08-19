namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Per-field ROI baseline posture mirrored in <c>proofPackageCompleteness.roiBaselineInputs</c> on pilot-run-deltas.
/// </summary>
public sealed class PilotRoiBaselineInputsStatusResponse
{
    public PilotRoiBaselineInputBasis ReviewCycleHoursBasis
    {
        get;
        init;
    }

    public PilotRoiBaselineInputBasis ArchitectPrepHoursPerReviewBasis
    {
        get;
        init;
    }

    /// <summary>Reviews-per-quarter cadence from the in-product scorecard (evidence-assembly effort proxy).</summary>
    public PilotRoiBaselineInputBasis EvidenceAssemblyEffortBasis
    {
        get;
        init;
    }

    public PilotRoiBaselineInputBasis ArchitectHourlyCostBasis
    {
        get;
        init;
    }

    /// <summary>
    ///     When <see langword="false" />, sponsor UI and copy must not lead with projected USD savings from findings rollups.
    /// </summary>
    public bool ProjectedDollarClaimsSponsorSafe
    {
        get;
        init;
    }

    /// <summary>Operator-facing sentence for Markdown tables when any input is not buyer-provided.</summary>
    public string SponsorSafeFallbackCopy
    {
        get;
        init;
    } = string.Empty;
}
