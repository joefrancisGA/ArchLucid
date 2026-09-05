using ArchLucid.Application.InfraEvidence.Branding;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantBrandContrastValidatorTests
{
    [Fact]
    public void MeetsWcagAaMinimum_returns_true_for_product_default_fg_bg_pair()
    {
        TenantBrandContrastValidator.MeetsWcagAaMinimum(
                ProductBrandingDefaults.ForegroundColor,
                ProductBrandingDefaults.BackgroundColor)
            .Should().BeTrue();
    }

    [Fact]
    public void MeetsWcagAaMinimum_returns_false_for_low_contrast_pair()
    {
        TenantBrandContrastValidator.MeetsWcagAaMinimum("#ffff00", "#ffffff").Should().BeFalse();
    }
}
