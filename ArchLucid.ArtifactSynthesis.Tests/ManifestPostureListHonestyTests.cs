using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestPostureListHonestyTests
{
    [Fact]
    public async Task NarrativeGenerator_distinguishes_null_requirements_from_empty_lists()
    {
        ManifestDocument nullRequirements = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Honesty" },
            Requirements = null!,
        };

        ArchitectureNarrativeArtifactGenerator generator = new();
        SynthesizedArtifact nullArtifact = await generator.GenerateAsync(nullRequirements, CancellationToken.None);
        nullArtifact.Content.Should().Contain(ManifestPostureListHonesty.RequirementsCoverageNotStored);

        ManifestDocument emptyRequirements = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Honesty" },
            Requirements = new RequirementsCoverageSection(),
        };

        SynthesizedArtifact emptyArtifact = await generator.GenerateAsync(emptyRequirements, CancellationToken.None);
        emptyArtifact.Content.Should().Contain(ArchitectureManifestNarrativeHonestyCopy.RequirementsCoverageStoredEmpty);
        emptyArtifact.Content.Should().NotContain("Requirements were not stored.");
    }

    [Fact]
    public async Task ReferenceGenerator_labels_null_topology_section_as_not_stored()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Honesty" },
            Topology = null!,
        };

        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain(ManifestPostureListHonesty.TopologySectionNotStored);
        artifact.Content.Should().NotContain("No topology information recorded.");
    }

    [Fact]
    public async Task ReferenceGenerator_distinguishes_null_security_lists_from_empty_lists()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Honesty" },
            Security = null!,
        };

        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain(ManifestPostureListHonesty.SecurityPostureNotStored);
        artifact.Content.Should().NotContain("No security posture recorded.");
    }
}
