using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
public sealed class SponsorReviewPacketPortfolioSignalsFactoryTests
{
    [Fact]
    public void Create_uses_expiring_waiver_count_from_roi_summary_not_active_waiver_total()
    {
        SponsorRoiSummaryResponse roiSummary = new()
        {
            ExpiringWaiversCount14Days = 2,
            StaleArchitectureRiskCount = 4,
            RealizedValue = new RealizedValueSummary
            {
                ActiveWaiversCount = 9,
            },
        };

        SponsorReviewPacketPortfolioSignals signals =
            SponsorReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        signals.ExpiringWaiversCount14Days.Should().Be(2);
        signals.StaleRiskCount.Should().Be(4);
        signals.NextActions.Should().BeEmpty();
    }

    [Fact]
    public void Create_prefixes_deferred_and_waived_next_actions_from_disposition_amounts()
    {
        SponsorRoiSummaryResponse roiSummary = new()
        {
            BasisBreakdown = new SponsorRoiBasisBreakdown
            {
                DeferredUsd = 100m,
                WaivedUsd = 50m,
            },
        };

        SponsorReviewPacketPortfolioSignals signals =
            SponsorReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        signals.NextActions.Should().HaveCount(2);
        signals.NextActions[0].Should().StartWith("Derived from disposition amounts:");
        signals.NextActions[1].Should().StartWith("Derived from disposition amounts:");
    }

    [Fact]
    public void Create_does_not_add_finops_fallback_when_no_deferred_or_waived_amounts()
    {
        SponsorRoiSummaryResponse roiSummary = new()
        {
            BasisBreakdown = new SponsorRoiBasisBreakdown
            {
                DeferredUsd = 0m,
                WaivedUsd = 0m,
            },
        };

        SponsorReviewPacketPortfolioSignals signals =
            SponsorReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        signals.NextActions.Should().BeEmpty();
        signals.NextActions.Should().NotContain(action => action.Contains("FinOps", StringComparison.OrdinalIgnoreCase));
    }
}
