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

    [Theory]
    [InlineData(100, 1, 1, 50)]
    [InlineData(100, 1, 3, 25)]
    [InlineData(100, 3, 1, 75)]
    [InlineData(100, 0, 3, 0)]
    public void ComputeRealModeSavingsUsd_UsesExactRealRunShare(
        int totalSavings,
        int realRuns,
        int simulatorRuns,
        int expectedSavings)
    {
        SponsorRoiHistoryRunModeCalculator.ComputeRealModeSavingsUsd(
                totalSavings, realRuns, simulatorRuns)
            .Should().Be(expectedSavings);
    }

    [Fact]
    public void ComputeRealModeSavingsUsd_NegativeSimulatorCount_DoesNotInflateSavings()
    {
        SponsorRoiHistoryRunModeCalculator.ComputeRealModeSavingsUsd(100m, 2, -1)
            .Should().Be(0m);
    }
}
