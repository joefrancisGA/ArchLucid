using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;
/// <summary>
///     Operator-facing bundle: live process counters (same source as <see cref = "IWhyArchLucidSnapshotService"/>)
///     plus optional non-authoritative monthly spend band from <see cref = "ITenantCostEstimateService"/>.
/// </summary>
public sealed record TenantMeasuredRoiSummary(WhyArchLucidSnapshotResponse ProcessSignals, TenantCostEstimate? MonthlyCostBand, string Disclaimer)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ProcessSignals, MonthlyCostBand, Disclaimer);
    private static byte __ValidatePrimaryConstructorArguments(ArchLucid.Contracts.Pilots.WhyArchLucidSnapshotResponse processSignals, ArchLucid.Application.Billing.TenantCostEstimate? monthlyCostBand, System.String disclaimer)
    {
        ArgumentNullException.ThrowIfNull(processSignals);
        ArgumentNullException.ThrowIfNull(disclaimer);
        return (byte)0;
    }
}