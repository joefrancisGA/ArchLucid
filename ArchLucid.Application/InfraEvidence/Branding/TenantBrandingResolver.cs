using ArchLucid.Application.Pilots;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.InfraEvidence.Branding;

internal static class TenantBrandingResolver
{
    public static ResolvedTenantBrandingProfile Resolve(
        Guid tenantId,
        TenantBrandingProfileRecord? activeProfile,
        TenantBrandingProfileRecord? defaultProfile,
        TenantFirstValueReportBrandingRow? legacyRow)
    {
        TenantBrandingProfileRecord? profile = activeProfile ?? defaultProfile;

        if (profile is not null)
            return FromProfile(tenantId, profile);

        TenantFirstValueReportBrandingForExport? legacyExport =
            legacyRow is null
                ? null
                : FirstValueReportBrandingSanitizer.TryBuildExportModel(
                    legacyRow.BrandingLogoUrl,
                    legacyRow.BrandingCompanyName);

        if (legacyExport is not null)
        {
            return new ResolvedTenantBrandingProfile
            {
                TenantId = tenantId,
                IsProductBrand = false,
                CompanyDisplayName = legacyExport.CompanyDisplayName ?? string.Empty,
                LegacyLogoHttpsUrl = legacyExport.LogoHttpsUrl,
            };
        }

        return ProductBrand(tenantId);
    }

    private static ResolvedTenantBrandingProfile FromProfile(Guid tenantId, TenantBrandingProfileRecord profile) =>
        new()
        {
            TenantId = tenantId,
            IsProductBrand = false,
            CompanyDisplayName = profile.CompanyDisplayName ?? profile.ShortDisplayName ?? string.Empty,
            CompanyLegalName = profile.CompanyLegalName,
            ShortDisplayName = profile.ShortDisplayName,
            Tagline = profile.Tagline,
            WebsiteUrl = profile.WebsiteUrl,
            SupportUrl = profile.SupportUrl,
            LogoPrimaryAssetId = profile.LogoPrimaryAssetId,
            LogoSecondaryAssetId = profile.LogoSecondaryAssetId,
            LogoSquareAssetId = profile.LogoSquareAssetId,
            LogoFaviconAssetId = profile.LogoFaviconAssetId,
            LogoDarkAssetId = profile.LogoDarkAssetId,
            LogoLightAssetId = profile.LogoLightAssetId,
            LogoReportCoverAssetId = profile.LogoReportCoverAssetId,
            LogoMonoAssetId = profile.LogoMonoAssetId,
            SourceProfileStatus = profile.BrandingStatus,
        };

    private static ResolvedTenantBrandingProfile ProductBrand(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            IsProductBrand = true,
            CompanyDisplayName = ProductBrandingDefaults.CompanyDisplayName,
        };
}
