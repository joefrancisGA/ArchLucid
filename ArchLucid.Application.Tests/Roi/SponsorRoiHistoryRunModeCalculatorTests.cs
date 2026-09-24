using ArchLucid.Application.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiHistoryRunModeCalculatorTests
{
    [Fact]
    public void ComputeRealModeSavingsUsd_LargeRunCounts_DoNotOverflow()
    {
        SponsorRoiHistoryRunModeCalculator.ComputeRealModeSavingsUsd(
                100m, int.MaxValue, int.MaxValue)
            .Should().Be(50m);
    }

    [Fact]
    public void ComputeRealModeSavingsUsd_LargeSavings_DoesNotOverflowIntermediateProduct()
    {
        SponsorRoiHistoryRunModeCalculator.ComputeRealModeSavingsUsd(
                decimal.MaxValue, 1, 1)
            .Should().Be(decimal.MaxValue / 2);
    }
}
