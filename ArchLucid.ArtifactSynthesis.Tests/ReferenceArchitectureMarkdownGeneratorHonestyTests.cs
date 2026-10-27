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
    public async Task GenerateAsync_labels_empty_cost_risks_as_not_stored()
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

        artifact.Content.Should().Contain("- Cost risks were not stored.");
    }
}
