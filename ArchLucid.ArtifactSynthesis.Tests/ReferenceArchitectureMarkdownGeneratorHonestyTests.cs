using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReferenceArchitectureMarkdownGeneratorHonestyTests
{
    [Fact]
    public async Task GenerateAsync_formats_manifest_metadata_and_posture_fields_when_missing()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Collect review", Status = " ", Version = "   " },
            Requirements = new RequirementsCoverageSection
            {
                Covered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = " ",
                        CoverageStatus = null!,
                        RequirementText = string.Empty,
                    },
                ],
            },
            Security = new SecuritySection
            {
                Controls = [new SecurityPostureItem { ControlId = " ", ControlName = null!, Status = " ", Impact = " " }],
            },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    Category = " ",
                    Title = null!,
                    SelectedOption = " ",
                },
            ],
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        Severity = " ",
                        IssueType = null!,
                        Title = " ",
                        Description = null!,
                    },
                ],
            },
        };

        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain("Status: Status was stored empty.");
        artifact.Content.Should().Contain("Version: Version was stored empty.");
        artifact.Content.Should().Contain("Rule set id: Rule set id was not stored.");
        artifact.Content.Should().Contain("Requirement name was stored empty.");
        artifact.Content.Should().Contain("Requirement text was stored empty.");
        artifact.Content.Should().Contain("Decision category was stored empty.");
        artifact.Content.Should().Contain("Selected option was stored empty.");
        artifact.Content.Should().Contain("Issue title was stored empty.");
    }

    [Fact]
    public async Task GenerateAsync_labels_missing_and_empty_sponsor_summary_honestly()
    {
        ReferenceArchitectureMarkdownGenerator generator = new();

        SynthesizedArtifact missing = await generator.GenerateAsync(
            new ManifestDocument
            {
                RunId = Guid.NewGuid(),
                ManifestId = Guid.NewGuid(),
                Metadata = new ManifestMetadata { Name = "Collect review", Summary = null! },
            },
            CancellationToken.None);

        missing.Content.Should().Contain("Sponsor summary was not stored.");

        SynthesizedArtifact empty = await generator.GenerateAsync(
            new ManifestDocument
            {
                RunId = Guid.NewGuid(),
                ManifestId = Guid.NewGuid(),
                Metadata = new ManifestMetadata { Name = "Collect review", Summary = "   " },
            },
            CancellationToken.None);

        empty.Content.Should().Contain("Sponsor summary was stored empty.");
    }

    [Fact]
    public async Task GenerateAsync_labels_empty_cost_risks_as_stored_empty_list()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Cost honesty" },
            Cost = new CostSection(),
        };

        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain("- Cost risks were stored as an empty list.");
        artifact.Content.Should().Contain("- Cost notes were stored as an empty list.");
        artifact.Content.Should().Contain("- Cost Currency: Cost currency was not stored.");
        artifact.Content.Should().NotContain("- Cost risks were not stored.");
    }

    [Fact]
    public async Task GenerateAsync_labels_null_cost_notes_as_not_stored()
    {
        ReferenceArchitectureMarkdownGenerator generator = new();

        ManifestDocument nullNotes = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Cost honesty" },
            Cost = new CostSection { Notes = null! },
        };

        SynthesizedArtifact nullNotesArtifact = await generator.GenerateAsync(nullNotes, CancellationToken.None);

        nullNotesArtifact.Content.Should().Contain("- Cost notes were not stored.");
        nullNotesArtifact.Content.Should().NotContain("- Cost notes were stored as an empty list.");
    }

    [Fact]
    public async Task GenerateAsync_labels_empty_topology_strings_as_stored_empty()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Collect review" },
            Topology = new TopologySection
            {
                SelectedPatterns = [" "],
                Resources = ["   "],
                Gaps = [""],
            },
        };

        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain("Pattern was stored empty.");
        artifact.Content.Should().Contain("Resource was stored empty.");
        artifact.Content.Should().Contain("Topology gap was stored empty.");
    }
}
