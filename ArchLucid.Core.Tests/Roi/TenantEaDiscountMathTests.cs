using ArchLucid.Core.Roi;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class TenantEaDiscountMathTests
{
    [Theory]
    [InlineData(0, 1.0)]
    [InlineData(15, 0.85)]
    [InlineData(50, 0.5)]
    public void MultiplierFromPercentage_maps_percentage_to_effective_price_multiplier(decimal pct, decimal expectedMultiplier)
    {
        TenantEaDiscountMath.MultiplierFromPercentage(pct).Should().Be(expectedMultiplier);
    }

    [Theory]
    [InlineData(1.0, 0)]
    [InlineData(0.85, 15)]
    [InlineData(0.5, 50)]
    public void PercentageFromMultiplier_inverts_multiplier(decimal multiplier, decimal expectedPct)
    {
        TenantEaDiscountMath.PercentageFromMultiplier(multiplier).Should().Be(expectedPct);
    }

    [Fact]
    public void ApplyToRetailPrice_uses_effective_price_formula()
    {
        decimal effective = TenantEaDiscountMath.ApplyToRetailPrice(100m, 0.85m);

        effective.Should().Be(85m);
    }
}
