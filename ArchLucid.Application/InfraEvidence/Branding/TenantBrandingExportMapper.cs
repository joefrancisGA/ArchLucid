using ArchLucid.Application.Pilots;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

public static class TenantBrandingExportMapper
{
    public static async Task<TenantFirstValueReportBrandingForExport?> TryBuildFirstValueReportBrandingAsync(
        ITenantBrandingService brandingService,
        Guid tenantId,
        string apiBaseForLinks,
        CancellationToken cancellationToken)
    {
        ResolvedTenantBrandingProfile profile =
            await brandingService.GetBrandingProfileAsync(tenantId, cancellationToken);

        if (profile.IsProductBrand)
            return null;

        TenantBrandingLogo logo = await brandingService.GetLogoAsync(
            tenantId,
            BrandingDisplayContext.ReportCover,
            cancellationToken);

        string? logoUrl = logo.HttpsUrl;

        if (logoUrl is null && logo.AssetId is Guid assetId && !string.IsNullOrWhiteSpace(apiBaseForLinks))
        {
            string baseUrl = apiBaseForLinks.Trim().TrimEnd('/');
            logoUrl = $"{baseUrl}/v1/infra-evidence/branding/assets/{assetId:D}/content";
        }

        return FirstValueReportBrandingSanitizer.TryBuildExportModel(logoUrl, profile.CompanyDisplayName);
    }
}
