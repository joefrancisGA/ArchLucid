using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>Explicit product-text vs visual-brand rules per <see cref="BrandingDisplayContext"/>.</summary>
public static class TenantBrandingDisplayContextPolicy
{
    public static bool IsVisualMastheadContext(BrandingDisplayContext context) =>
        context is BrandingDisplayContext.ApplicationHeader
            or BrandingDisplayContext.Navigation
            or BrandingDisplayContext.Login
            or BrandingDisplayContext.Dashboard
            or BrandingDisplayContext.Mobile;

    public static bool IsReportVisualContext(BrandingDisplayContext context) =>
        context is BrandingDisplayContext.ReportCover
            or BrandingDisplayContext.ReportHeader
            or BrandingDisplayContext.ReportFooter
            or BrandingDisplayContext.Export
            or BrandingDisplayContext.Print
            or BrandingDisplayContext.Presentation
            or BrandingDisplayContext.Email;

    public static bool UsesTenantVisualBrand(BrandingDisplayContext context) =>
        IsVisualMastheadContext(context) || IsReportVisualContext(context) || context is BrandingDisplayContext.Favicon;

    public static TenantBrandingSurfacePresentation Resolve(
        BrandingDisplayContext context,
        ResolvedTenantBrandingProfile profile,
        TenantBrandingLogo logo)
    {
        if (profile.IsProductBrand || !UsesTenantVisualBrand(context))
        {
            return new TenantBrandingSurfacePresentation
            {
                Context = context,
                MastheadDisplayName = ProductBrandingDefaults.CompanyDisplayName,
                UsesTenantVisualBrand = false,
                ShowPoweredByArchLucid = false,
                ShowArchLucidMarkInMasthead = true,
                Logo = logo,
            };
        }

        bool coBrandingEnabled = profile.CoBrandingEnabled;

        return new TenantBrandingSurfacePresentation
        {
            Context = context,
            MastheadDisplayName = profile.CompanyDisplayName,
            UsesTenantVisualBrand = true,
            ShowPoweredByArchLucid = coBrandingEnabled && IsVisualMastheadContext(context),
            ShowArchLucidMarkInMasthead = coBrandingEnabled && IsVisualMastheadContext(context),
            Logo = logo,
        };
    }
}
