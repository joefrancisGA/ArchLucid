using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Applies authoritative sponsor-facing ROI scope labels across API responses (T2-6).</summary>
public static class RoiSponsorFacingScopeLabeler
{
    public static void ApplySponsorRoiSummary(SponsorRoiSummaryResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        response.HeadlineSavingsScopeCode = RoiSponsorFacingScopeCodes.HeadlineDispositionAware;
        response.HeadlineSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware;
        response.SystemRowSavingsScopeCode = RoiSponsorFacingScopeCodes.SystemRowSnapshotPotential;
        response.SystemRowSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential;
        response.Trailing30DayActivityScopeDescription = RoiSponsorFacingScopeDescriptions.Trailing30DayFindingEvents;
    }

    public static void ApplyCrossTenantPortfolio(CrossTenantPortfolioSummaryResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        response.HeadlineSavingsScopeCode = RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline;
        response.HeadlineSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.CrossTenantPortfolioHeadline;
        response.PortfolioScopeDescription = RoiSponsorFacingScopeDescriptions.CrossTenantPortfolioHeadline;
    }
}
