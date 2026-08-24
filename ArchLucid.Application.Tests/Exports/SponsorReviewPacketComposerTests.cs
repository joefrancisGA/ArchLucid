using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorReviewPacketComposerTests
{
    [Fact]
    public void ComposeMarkdown_marks_demo_run_evidence_badges_demo_derived()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = ContosoRetailDemoIdentifiers.RunBaseline,
                RequestId = ContosoRetailDemoIdentifiers.RequestContoso,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = new GoldenManifest
            {
                RunId = ContosoRetailDemoIdentifiers.RunBaseline,
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            }
        };

        SponsorRoiSummaryResponse roiSummary = new()
        {
            SavingsPricingBasis = SponsorRoiSavingsPricingBasis.Retail,
            CostEvidenceFreshnessStatus = RoiCostEvidenceFreshness.Fresh
        };

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            detail,
            "Sponsor report prose.",
            ["Finding one"],
            roiSummary,
            DateTime.UtcNow);

        markdown.Should().Contain("demo-derived");
        markdown.Should().Contain("HOLD posture");
    }
}
