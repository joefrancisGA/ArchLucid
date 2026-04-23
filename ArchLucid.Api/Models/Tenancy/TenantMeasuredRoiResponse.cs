using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>HTTP projection of <see cref="TenantMeasuredRoiSummary"/> for <c>GET /v1/tenant/measured-roi</c>.</summary>
public sealed class TenantMeasuredRoiResponse
{
    public WhyArchLucidSnapshotResponse Snapshot { get; init; } = new();

    public TenantCostEstimateResponse? MonthlyCostEstimate { get; init; }

    public string Disclaimer { get; init; } = "";

    public static TenantMeasuredRoiResponse FromDomain(TenantMeasuredRoiSummary summary)
    {
        if (summary is null)
            throw new ArgumentNullException(nameof(summary));

        return new TenantMeasuredRoiResponse
        {
            Snapshot = summary.ProcessSignals,
            MonthlyCostEstimate = summary.MonthlyCostBand is null
                ? null
                : TenantCostEstimateResponse.FromDomain(summary.MonthlyCostBand),
            Disclaimer = summary.Disclaimer,
        };
    }
}
