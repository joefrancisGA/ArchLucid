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
        TenantReportBrandingApplyHelper helper = new(brandingService);
        TenantReportBrandingForExport? resolved = await helper.ResolveForExportAsync(
            tenantId,
            BrandingDisplayContext.ReportCover,
            apiBaseForLinks,
            cancellationToken);

        if (resolved is null)
            return null;

        return FirstValueReportBrandingSanitizer.TryBuildExportModel(
            resolved.LogoHttpsUrl,
            resolved.CompanyDisplayName);
    }
}
