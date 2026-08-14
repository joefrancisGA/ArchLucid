using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Roi;

/// <summary>Sponsor dashboard: ROI summary plus 30-day compliance drift trend in one payload.</summary>
public sealed class SponsorDashboardBundleResponse
{
    public SponsorRoiSummaryResponse SponsorReport
    {
        get;
        init;
    } = new();

    public IReadOnlyList<ComplianceDriftTrendPoint> ComplianceDriftTrend
    {
        get;
        init;
    } = [];
}
