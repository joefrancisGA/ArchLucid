using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiExecutivePacketDispositionResolverTests
{
    [Theory]
    [InlineData(SponsorRoiSavingsPricingBasis.UploadedActualAmortized, RoiCostEvidenceFreshness.Fresh, SponsorRoiClaimDisposition.Pass)]
    [InlineData(SponsorRoiSavingsPricingBasis.Retail, RoiCostEvidenceFreshness.Missing, SponsorRoiClaimDisposition.Hold)]
    [InlineData(SponsorRoiSavingsPricingBasis.HeuristicFallback, RoiCostEvidenceFreshness.Fresh, SponsorRoiClaimDisposition.Hold)]
    [InlineData(SponsorRoiSavingsPricingBasis.EaAdjusted, RoiCostEvidenceFreshness.Stale, SponsorRoiClaimDisposition.Warn)]
    public void Resolve_maps_pricing_and_freshness_to_disposition(
        string pricingBasis,
        string freshness,
        SponsorRoiClaimDisposition expected)
    {
        SponsorRoiSummaryResponse roi = new()
        {
            SavingsPricingBasis = pricingBasis,
            CostEvidenceFreshnessStatus = freshness,
        };

        SponsorRoiExecutivePacketDispositionResolver.Resolve(roi).Should().Be(expected);
    }

    [Fact]
    public void ComposeMarkdown_includes_roi_claim_disposition_for_heuristic_basis()
    {
        SponsorRoiSummaryResponse roi = new()
        {
            SavingsPricingBasis = SponsorRoiSavingsPricingBasis.HeuristicFallback,
            CostEvidenceFreshnessStatus = RoiCostEvidenceFreshness.Fresh,
            TotalEstimatedUsdSavings = 1200m,
        };

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            },
            "summary",
            [],
            roi,
            DateTime.UtcNow);

        markdown.Should().Contain("**ROI claim disposition:**");
        markdown.Should().Contain("HOLD");
        markdown.Should().Contain("internal planning only");
    }

    [Fact]
    public void ComposeMarkdown_includes_hold_disposition_for_retail_basis_with_missing_freshness()
    {
        SponsorRoiSummaryResponse roi = new()
        {
            SavingsPricingBasis = SponsorRoiSavingsPricingBasis.Retail,
            CostEvidenceFreshnessStatus = RoiCostEvidenceFreshness.Missing,
            TotalEstimatedUsdSavings = 900m,
        };

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "r-retail", Status = ArchitectureRunStatus.Committed },
            },
            "summary",
            [],
            roi,
            DateTime.UtcNow);

        markdown.Should().Contain("**ROI claim disposition:**");
        markdown.Should().Contain("HOLD");
        markdown.Should().Contain("internal planning only");
        markdown.Should().Contain("do not circulate projected savings externally");
    }
}
