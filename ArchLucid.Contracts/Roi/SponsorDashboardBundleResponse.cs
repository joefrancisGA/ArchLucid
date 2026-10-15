using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Roi;

/// <summary>Sponsor dashboard: ROI summary plus 30-day compliance drift trend in one payload.</summary>
public sealed class SponsorDashboardBundleResponse
{
    public SponsorRoiSummaryResponse SponsorReport
    {
        get;
        init;
    } = new();

    private IReadOnlyList<ComplianceDriftTrendPoint> complianceDriftTrend = [];

    public IReadOnlyList<ComplianceDriftTrendPoint> ComplianceDriftTrend
    {
        get => complianceDriftTrend;
        init => complianceDriftTrend = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
