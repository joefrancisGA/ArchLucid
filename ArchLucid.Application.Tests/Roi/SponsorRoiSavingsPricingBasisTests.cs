using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiSavingsPricingBasisTests
{
    [Theory]
    [InlineData(1.0, SponsorRoiSavingsPricingBasis.Retail)]
    [InlineData(1.25, SponsorRoiSavingsPricingBasis.Retail)]
    [InlineData(0.85, SponsorRoiSavingsPricingBasis.EaAdjusted)]
    public void Resolve_maps_multiplier_to_basis(decimal multiplier, string expected)
    {
        SponsorRoiSavingsPricingBasis.Resolve(multiplier).Should().Be(expected);
    }

    [Theory]
    [InlineData(1.0, true, false, SponsorRoiSavingsPricingBasis.UploadedActualAmortized)]
    [InlineData(0.85, true, false, SponsorRoiSavingsPricingBasis.UploadedActualAmortized)]
    [InlineData(0.85, false, false, SponsorRoiSavingsPricingBasis.EaAdjusted)]
    [InlineData(1.0, false, true, SponsorRoiSavingsPricingBasis.HeuristicFallback)]
    [InlineData(1.0, false, false, SponsorRoiSavingsPricingBasis.Retail)]
    public void Resolve_with_signals_maps_to_basis(
        decimal multiplier,
        bool hasUploaded,
        bool hasHeuristic,
        string expected)
    {
        SponsorRoiSavingsPricingBasis.Resolve(multiplier, hasUploaded, hasHeuristic).Should().Be(expected);
    }
}
