using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantBrandingDisplayContextPolicyTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public void ApplicationHeader_with_active_profile_uses_company_display_name()
    {
        ResolvedTenantBrandingProfile profile = new()
        {
            TenantId = TenantId,
            IsProductBrand = false,
            CompanyDisplayName = "Fabrikam Holdings",
            SourceProfileStatus = BrandingProfileStatus.Active,
        };

        TenantBrandingSurfacePresentation presentation = TenantBrandingDisplayContextPolicy.Resolve(
            BrandingDisplayContext.ApplicationHeader,
            profile,
            new TenantBrandingLogo { IsProductBrand = false, HttpsUrl = "https://cdn.example/logo.png" });

        presentation.MastheadDisplayName.Should().Be("Fabrikam Holdings");
        presentation.UsesTenantVisualBrand.Should().BeTrue();
    }

    [Fact]
    public void ApplicationHeader_with_co_branding_disabled_hides_archlucid_mark()
    {
        ResolvedTenantBrandingProfile profile = new()
        {
            TenantId = TenantId,
            IsProductBrand = false,
            CompanyDisplayName = "Fabrikam Holdings",
            CoBrandingEnabled = false,
        };

        TenantBrandingSurfacePresentation presentation = TenantBrandingDisplayContextPolicy.Resolve(
            BrandingDisplayContext.ApplicationHeader,
            profile,
            new TenantBrandingLogo { IsProductBrand = false });

        presentation.ShowArchLucidMarkInMasthead.Should().BeFalse();
        presentation.ShowPoweredByArchLucid.Should().BeFalse();
    }

    [Fact]
    public void ApplicationHeader_with_co_branding_enabled_shows_powered_by()
    {
        ResolvedTenantBrandingProfile profile = new()
        {
            TenantId = TenantId,
            IsProductBrand = false,
            CompanyDisplayName = "Fabrikam Holdings",
            CoBrandingEnabled = true,
        };

        TenantBrandingSurfacePresentation presentation = TenantBrandingDisplayContextPolicy.Resolve(
            BrandingDisplayContext.ApplicationHeader,
            profile,
            new TenantBrandingLogo { IsProductBrand = false });

        presentation.ShowArchLucidMarkInMasthead.Should().BeTrue();
        presentation.ShowPoweredByArchLucid.Should().BeTrue();
    }

    [Fact]
    public void Sample_help_markdown_retains_archlucid_product_identity()
    {
        OperatorHelpProductTextPolicy.RetainsProductIdentity(OperatorHelpProductTextPolicy.SampleHelpMarkdown)
            .Should().BeTrue();
    }
}
