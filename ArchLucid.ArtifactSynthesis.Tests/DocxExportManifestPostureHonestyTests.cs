using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DocxExportManifestPostureHonestyTests
{
    [Fact]
    public void FormatCostCurrencyLine_distinguishes_null_empty_and_stored()
    {
        DocxExportManifestPostureHonesty.FormatCostCurrencyLine(null)
            .Should()
            .Contain(ArchitectureManifestNarrativeHonestyCopy.CostCurrencyNotStored);

        DocxExportManifestPostureHonesty.FormatCostCurrencyLine("   ")
            .Should()
            .Contain(ArchitectureManifestNarrativeHonestyCopy.CostCurrencyStoredEmpty);

        DocxExportManifestPostureHonesty.FormatCostCurrencyLine("USD")
            .Should()
            .Contain("USD");
    }

    [Fact]
    public void FormatDiagramFallbackTopologyCensusLine_avoids_fake_zero_counts()
    {
        ManifestDocument manifest = new()
        {
            Decisions = [],
        };

        string line = DocxExportManifestPostureHonesty.FormatDiagramFallbackTopologyCensusLine(manifest);

        line.Should().Contain("Topology resources: stored empty");
        line.Should().NotContain(": 0 stored");
    }

    [Fact]
    public void FormatRecommendedImprovementsOverflowLine_lists_cap_and_omitted()
    {
        DocxExportManifestPostureHonesty.FormatRecommendedImprovementsOverflowLine(15)
            .Should()
            .Contain("10 of 15")
            .And.Contain("5 more were not listed");
    }
}
