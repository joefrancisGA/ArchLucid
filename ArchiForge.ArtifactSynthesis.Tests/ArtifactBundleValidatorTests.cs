using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ArtifactSynthesis.Services;

using FluentAssertions;

namespace ArchiForge.ArtifactSynthesis.Tests;

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
                ContentHash = "h1",
            });
        bundle.Artifacts.Add(
            new SynthesizedArtifact
            {
                ArtifactType = "inventory",
                Content = "b",
                ContentHash = "h2",
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
                    ContentHash = "abc",
                },
            ],
        };
    }
}
