using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSavingsPricingBasisTests
{
    [Theory]
    [InlineData(1.0, ExecutiveRoiSavingsPricingBasis.Retail)]
    [InlineData(1.25, ExecutiveRoiSavingsPricingBasis.Retail)]
    [InlineData(0.85, ExecutiveRoiSavingsPricingBasis.EaAdjusted)]
    public void Resolve_maps_multiplier_to_basis(decimal multiplier, string expected)
    {
        ExecutiveRoiSavingsPricingBasis.Resolve(multiplier).Should().Be(expected);
    }
}
