using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactBundleValidatorTests
{
    [Fact]
    public void Validate_when_duplicate_artifact_types_throws()
    {
        ArtifactBundle bundle = ValidBundle();
        bundle.Artifacts.Add(
            new SynthesizedArtifact
            {
                ArtifactType = "Inventory",
                Content = "a",
                ContentHash = ArtifactHashing.ComputeHash("a"),
            });
        bundle.Artifacts.Add(
            new SynthesizedArtifact
            {
                ArtifactType = "inventory",
                Content = "b",
                ContentHash = ArtifactHashing.ComputeHash("b"),
            });

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage("*Duplicate*");
    }

    [Fact]
    public void Validate_when_content_empty_throws()
    {
        ArtifactBundle bundle = ValidBundle();
        bundle.Artifacts[0].Content = "   ";

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage("*content*");
    }

    [Theory]
    [InlineData(ArtifactType.ArchitectureNarrative)]
    [InlineData(ArtifactType.ReferenceArchitectureMarkdown)]
    public void Validate_when_architecture_missing_headers_throws(string artifactType)
    {
        ArtifactBundle bundle = ValidBundle();
        bundle.Artifacts[0].ArtifactType = artifactType;
        bundle.Artifacts[0].Content = "Missing headers";
        bundle.Artifacts[0].ContentHash = ArtifactHashing.ComputeHash(bundle.Artifacts[0].Content);

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage("*missing required markdown*");
    }

    [Theory]
    [InlineData(ArtifactType.ArchitectureNarrative)]
    [InlineData(ArtifactType.ReferenceArchitectureMarkdown)]
    public void Validate_when_architecture_has_all_headers_passes(string artifactType)
    {
        ArtifactBundle bundle = ValidBundle();
        bundle.Artifacts[0].ArtifactType = artifactType;
        bundle.Artifacts[0].Content = string.Join(
            Environment.NewLine,
            "## Objective",
            "## Assumptions",
            "## Constraints",
            "## Architecture Overview",
            "## Component Breakdown",
            "## Data Flow",
            "## Security Model",
            "## Operational Considerations");
        bundle.Artifacts[0].ContentHash = ArtifactHashing.ComputeHash(bundle.Artifacts[0].Content);

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_when_content_hash_mismatch_throws()
    {
        ArtifactBundle bundle = ValidBundle();
        bundle.Artifacts[0].Content = "hello";
        bundle.Artifacts[0].ContentHash = "DEADBEEF";

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage("*hash does not match*");
    }

    private static ArtifactBundle ValidBundle()
    {
        return new ArtifactBundle
        {
            BundleId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactType = "Test",
                    Content = "body",
                    ContentHash = ArtifactHashing.ComputeHash("body"),
                },
            ],
        };
    }
}
