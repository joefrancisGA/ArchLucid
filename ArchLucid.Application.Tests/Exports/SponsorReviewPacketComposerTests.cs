using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
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

    [Fact]
    public void ComposeMarkdown_includes_top_level_demo_notice_for_demo_run()
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

        int demoNoticeIndex = markdown.IndexOf("Demo notice", StringComparison.Ordinal);
        int manifestSummaryIndex = markdown.IndexOf("## Manifest summary", StringComparison.Ordinal);

        demoNoticeIndex.Should().BeGreaterThan(-1);
        manifestSummaryIndex.Should().BeGreaterThan(-1);
        demoNoticeIndex.Should().BeLessThan(manifestSummaryIndex);
        markdown.Should().Contain(ArchitectureReviewBoardCoverPageContent.DemoTenantNotice);
    }

    [Fact]
    public void ComposeMarkdown_includes_active_trial_notice_when_provided()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = new GoldenManifest
            {
                RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
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
            DateTime.UtcNow,
            activeTrialExportNotice: ActiveTrialExportNoticeFormatter.BaseSuffix);

        markdown.Should().Contain("Trial notice");
        markdown.Should().Contain(ActiveTrialExportNoticeFormatter.BaseSuffix);
    }

    [Fact]
    public void ComposeMarkdown_prepends_sendable_export_cover_when_honesty_material_present()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = new GoldenManifest
            {
                RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
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

        CareerExportCoverageHonestyInput careerExportHonesty = new(
            new SponsorReviewCoverageHonestyContext(
                RunId: detail.Run!.RunId,
                Verdict: new FeasibilityVerdict { Kind = FeasibilityVerdictKind.SoftInfeasible, Summary = "Blocked" },
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 4,
            WorkingDesk: true,
            ClassificationCounts: null,
            CatalogAdvisoryEngineFailureCount: 0,
            PreCommitGateEnabled: true,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            IsSampleRun: false,
            RuleSetId: "azure-waf",
            RuleSetVersion: "2024.1");

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            detail,
            "Sponsor report prose.",
            ["Finding one"],
            roiSummary,
            DateTime.UtcNow,
            careerExportHonesty: careerExportHonesty);

        markdown.Should().Contain("## Sendable export cover");
        markdown.Should().Contain("Policy pack: azure-waf @ 2024.1");
        markdown.Should().Contain("## Measurement floor");
    }
}
