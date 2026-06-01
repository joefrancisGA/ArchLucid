using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
public sealed class ExecutiveReviewPacketPortfolioSignalsFactoryTests
{
    [Fact]
    public void Create_uses_expiring_waiver_count_from_roi_summary_not_active_waiver_total()
    {
        ExecutiveRoiSummaryResponse roiSummary = new()
        {
            ExpiringWaiversCount14Days = 2,
            RealizedValue = new RealizedValueSummary
            {
                ActiveWaiversCount = 9,
            },
        };

        ExecutiveReviewPacketPortfolioSignals signals =
            ExecutiveReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        signals.ExpiringWaiversCount14Days.Should().Be(2);
    }
}
