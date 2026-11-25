using ArchLucid.Core.Roi;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class TenantEaDiscountMathTests
{
    [Fact]
    public void ApplyToRetailPrice_rounds_at_the_four_decimal_midpoint()
    {
        TenantEaDiscountMath.ApplyToRetailPrice(1.23444m, 1m).Should().Be(1.2344m);
        TenantEaDiscountMath.ApplyToRetailPrice(1.23445m, 1m).Should().Be(1.2345m);
    }

    [Theory]
    [InlineData(0, 1.0)]
    [InlineData(15, 0.85)]
    [InlineData(50, 0.5)]
    [InlineData(99.98, 0.0002)]
    [InlineData(99.999, 0.0001)]
    [InlineData(100, 0.0001)]
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
