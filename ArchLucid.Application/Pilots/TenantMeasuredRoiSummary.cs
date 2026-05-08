using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Operator-facing bundle: live process counters (same source as <see cref = "IWhyArchLucidSnapshotService"/>)
///     plus optional non-authoritative monthly spend band from <see cref = "ITenantCostEstimateService"/>.
/// </summary>
public sealed record TenantMeasuredRoiSummary
{
    public WhyArchLucidSnapshotResponse ProcessSignals
    {
        get;
        init;
    }

    public TenantCostEstimate? MonthlyCostBand
    {
        get;
        init;
    }

    public string Disclaimer
    {
        get;
        init;
    }

    public TenantMeasuredRoiSummary(WhyArchLucidSnapshotResponse processSignals, TenantCostEstimate? monthlyCostBand, string disclaimer)
    {
        ProcessSignals = processSignals ?? throw new ArgumentNullException(nameof(processSignals));
        MonthlyCostBand = monthlyCostBand;
        Disclaimer = disclaimer ?? throw new ArgumentNullException(nameof(disclaimer));
    }
}
