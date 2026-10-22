using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

internal static class TenantBrandingLogoAssetSelector
{
    public static Guid? SelectAssetId(ResolvedTenantBrandingProfile profile, BrandingDisplayContext context)
    {
        if (profile.IsProductBrand)
            return null;

        return context switch
        {
            BrandingDisplayContext.Favicon => profile.LogoFaviconAssetId ?? profile.LogoSquareAssetId,
            BrandingDisplayContext.ReportCover or BrandingDisplayContext.Export or BrandingDisplayContext.Print
                => profile.LogoReportCoverAssetId ?? profile.LogoPrimaryAssetId,
            BrandingDisplayContext.ReportHeader or BrandingDisplayContext.ReportFooter or BrandingDisplayContext.Presentation
                => profile.LogoPrimaryAssetId ?? profile.LogoReportCoverAssetId,
            BrandingDisplayContext.Mobile => profile.LogoSquareAssetId ?? profile.LogoPrimaryAssetId,
            _ => profile.LogoPrimaryAssetId
                ?? profile.LogoLightAssetId
                ?? profile.LogoDarkAssetId
                ?? profile.LogoSecondaryAssetId,
        };
    }
}
