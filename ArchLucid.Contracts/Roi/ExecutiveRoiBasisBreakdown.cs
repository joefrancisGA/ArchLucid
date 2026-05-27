namespace ArchLucid.Contracts.Roi;

/// <summary>
///     USD savings partitioned by finding disposition and waiver state so estimated potential is not conflated with
///     realized, accepted-risk, waived, or deferred value (Batch B).
/// </summary>
public sealed class ExecutiveRoiBasisBreakdown
{
    /// <summary>Label for sponsor-facing copy (always <c>estimated</c> for non-remediated buckets).</summary>
    public const string CostBasisLabel = "estimated";

    /// <summary>Findings with no disposition and no active waiver — counts toward headline estimated savings.</summary>
    public decimal OpenEstimatedUsd
    {
        get;
        init;
    }

    /// <summary>Disposition <see cref="Findings.FindingDisposition.Accepted" /> — accepted residual risk, not realized savings.</summary>
    public decimal AcceptedRiskUsd
    {
        get;
        init;
    }

    /// <summary>Disposition <see cref="Findings.FindingDisposition.NeedsEvidence" /> — value held pending evidence.</summary>
    public decimal NeedsEvidenceUsd
    {
        get;
        init;
    }

    /// <summary>Disposition <see cref="Findings.FindingDisposition.Deferred" /> — excluded from realized totals.</summary>
    public decimal DeferredUsd
    {
        get;
        init;
    }

    /// <summary>Active time-bounded waivers — excluded from realized totals.</summary>
    public decimal WaivedUsd
    {
        get;
        init;
    }

    /// <summary>Disposition <see cref="Findings.FindingDisposition.Remediated" /> — counts toward realized value.</summary>
    public decimal RealizedUsd
    {
        get;
        init;
    }

    /// <summary>Disposition <see cref="Findings.FindingDisposition.RejectedAsNotApplicable" />.</summary>
    public decimal RejectedNotApplicableUsd
    {
        get;
        init;
    }

    /// <summary>Sum of buckets; mirrors <see cref="ExecutiveRoiSummaryResponse.TotalEstimatedUsdSavings" /> when aligned to open+accepted+needs+deferred only.</summary>
    public decimal TotalPotentialUsd
    {
        get;
        init;
    }
}
