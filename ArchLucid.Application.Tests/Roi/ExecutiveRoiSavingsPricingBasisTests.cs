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

    [Theory]
    [InlineData(1.0, true, false, ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized)]
    [InlineData(0.85, true, false, ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized)]
    [InlineData(0.85, false, false, ExecutiveRoiSavingsPricingBasis.EaAdjusted)]
    [InlineData(1.0, false, true, ExecutiveRoiSavingsPricingBasis.HeuristicFallback)]
    [InlineData(1.0, false, false, ExecutiveRoiSavingsPricingBasis.Retail)]
    public void Resolve_with_signals_maps_to_basis(
        decimal multiplier,
        bool hasUploaded,
        bool hasHeuristic,
        string expected)
    {
        ExecutiveRoiSavingsPricingBasis.Resolve(multiplier, hasUploaded, hasHeuristic).Should().Be(expected);
    }
}
