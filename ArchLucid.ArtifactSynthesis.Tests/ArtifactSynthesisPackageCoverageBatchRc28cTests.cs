using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28c package-coverage batch: branded DOCX template generator and coverage-summary model properties.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28cTests
{
    [Fact]
    public void BrandedArchitectureTemplateGenerator_CreateTemplateBytes_returns_docx_zip()
    {
        byte[] bytes = BrandedArchitectureTemplateGenerator.CreateTemplateBytes();

        bytes.Should().NotBeEmpty();
        // OpenXML packages are ZIP containers (PK header).
        bytes[0].Should().Be(0x50);
        bytes[1].Should().Be(0x4B);
        bytes.Length.Should().BeGreaterThan(1_000);
    }

    [Fact]
    public void CoverageSummaryArtifactModel_round_trips_property_bag()
    {
        CoverageSummaryArtifactModel model = new()
        {
            CoveredRequirementCount = 4,
            UncoveredRequirementCount = 2,
            SecurityGapCount = 1,
            ComplianceGapCount = 1,
            UnresolvedIssueCount = 3,
            TopologyGaps = ["missing private endpoint"],
        };

        model.CoveredRequirementCount.Should().Be(4);
        model.UncoveredRequirementCount.Should().Be(2);
        model.SecurityGapCount.Should().Be(1);
        model.ComplianceGapCount.Should().Be(1);
        model.UnresolvedIssueCount.Should().Be(3);
        model.TopologyGaps.Should().ContainSingle("missing private endpoint");
        TerraformAdvisoryExportCopy.DisclaimerLine.Should().Contain("advisory");
    }
}
