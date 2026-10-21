using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Artifacts;
using FluentAssertions;

namespace ArchLucid.Core.Tests.Artifacts;

[Trait("Category", "Unit")]
public sealed class SynthesizedArtifactBundleCanonicalizerTests
{
    [Fact]
    public void Canonicalize_is_order_invariant_when_content_hashes_conflict()
    {
        Guid artifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        SynthesizedArtifact v1 = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        SynthesizedArtifact v2 = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v2",
            ContentHash = "hash-v2",
        };

        SynthesizedArtifactBundleCanonicalizationResult forward =
            SynthesizedArtifactBundleCanonicalizer.Canonicalize([v1, v2]);
        SynthesizedArtifactBundleCanonicalizationResult reverse =
            SynthesizedArtifactBundleCanonicalizer.Canonicalize([v2, v1]);

        forward.Artifacts.Should().HaveCount(1);
        reverse.Artifacts.Should().HaveCount(1);
        reverse.Artifacts[0].ContentHash.Should().Be(forward.Artifacts[0].ContentHash);
        forward.Conflicts.Should().ContainSingle();
        forward.Conflicts[0].ContentHashes.Should().BeEquivalentTo(["hash-v1", "hash-v2"]);
    }

}
