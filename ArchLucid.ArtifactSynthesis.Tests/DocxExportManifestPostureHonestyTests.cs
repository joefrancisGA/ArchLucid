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
    public void RecommendedImprovementsGeneratedEmptyExportLabel_is_generated_not_recorded()
    {
        DocxExportManifestPostureHonesty.RecommendedImprovementsGeneratedEmptyExportLabel
            .Should()
            .Be("No recommendations were generated for this export.");
    }
}
