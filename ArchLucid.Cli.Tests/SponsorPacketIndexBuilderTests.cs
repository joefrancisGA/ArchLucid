using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorPacketIndexBuilderTests
{
    [Fact]
    public void Build_lists_required_artifacts_and_regenerate_command()
    {
        IReadOnlyList<string> present =
        [
            SponsorPacketArtifactCatalog.IndexFileName,
            SponsorPacketArtifactCatalog.FirstValueReportFileName,
            SponsorPacketArtifactCatalog.SponsorReportFileName,
            SponsorPacketArtifactCatalog.PilotRunDeltasFileName,
            "limitations.md",
        ];

        string markdown = SponsorPacketIndexBuilder.Build(
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            @"C:\packets\demo",
            present);

        markdown.Should().Contain("# Sponsor packet index");
        markdown.Should().Contain("first-value-report.md");
        markdown.Should().Contain("sponsor-report.json");
        markdown.Should().Contain("pilot-run-deltas.json");
        markdown.Should().Contain("archlucid sponsor-packet");
        markdown.Should().Contain("| yes |");
        markdown.Should().Contain("| no |");
    }

    [Fact]
    public void Artifact_catalog_includes_index_and_provenance_files()
    {
        SponsorPacketArtifactCatalog.IndexEntries
            .Select(static entry => entry.FileName)
            .Should()
            .Contain(
            [
                SponsorPacketArtifactCatalog.IndexFileName,
                SponsorPacketArtifactCatalog.ProvenanceReferencesFileName,
                SponsorPacketArtifactCatalog.PackManifestFileName,
            ]);
    }
}
