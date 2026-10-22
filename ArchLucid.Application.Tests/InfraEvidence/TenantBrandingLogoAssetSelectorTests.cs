using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("BrandingShipGate", "BR-09")]
public sealed class TenantBrandingLogoAssetSelectorTests
{
    private static readonly Guid FaviconId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid PrimaryId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid DarkId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid LightId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid ReportCoverId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Fact]
    public void SelectAssetId_prefers_favicon_asset_for_favicon_context()
    {
        ResolvedTenantBrandingProfile profile = BuildProfile();

        Guid? selected = TenantBrandingLogoAssetSelector.SelectAssetId(profile, BrandingDisplayContext.Favicon);

        selected.Should().Be(FaviconId);
    }

    [Fact]
    public void SelectAssetId_prefers_report_cover_for_export_context()
    {
        ResolvedTenantBrandingProfile profile = BuildProfile();

        Guid? selected = TenantBrandingLogoAssetSelector.SelectAssetId(profile, BrandingDisplayContext.Export);

        selected.Should().Be(ReportCoverId);
    }

    [Fact]
    public void SelectAssetId_falls_back_to_primary_for_application_header()
    {
        ResolvedTenantBrandingProfile profile = BuildProfile();

        Guid? selected = TenantBrandingLogoAssetSelector.SelectAssetId(profile, BrandingDisplayContext.ApplicationHeader);

        selected.Should().Be(PrimaryId);
    }

    [Fact]
    public void SelectAssetId_returns_null_for_product_brand()
    {
        ResolvedTenantBrandingProfile profile = new()
        {
            TenantId = Guid.NewGuid(),
            IsProductBrand = true,
            CompanyDisplayName = ProductBrandingDefaults.CompanyDisplayName,
            LogoPrimaryAssetId = PrimaryId,
        };

        TenantBrandingLogoAssetSelector.SelectAssetId(profile, BrandingDisplayContext.ApplicationHeader)
            .Should().BeNull();
    }

    private static ResolvedTenantBrandingProfile BuildProfile() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            IsProductBrand = false,
            CompanyDisplayName = "Fabrikam Holdings",
            LogoFaviconAssetId = FaviconId,
            LogoPrimaryAssetId = PrimaryId,
            LogoDarkAssetId = DarkId,
            LogoLightAssetId = LightId,
            LogoReportCoverAssetId = ReportCoverId,
        };
}
