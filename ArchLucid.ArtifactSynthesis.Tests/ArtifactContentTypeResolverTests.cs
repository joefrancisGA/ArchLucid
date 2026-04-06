using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class ArtifactContentTypeResolverTests
{
    [Theory]
    [InlineData("json", "application/json")]
    [InlineData("Markdown", "text/markdown")]
    [InlineData("Other", "text/plain")]
    public void Resolve_maps_known_formats(string format, string expected)
    {
        ArtifactContentTypeResolver resolver = new();
        SynthesizedArtifact artifact = new()
        {
            Format = format,
            ArtifactType = "t",
            Name = "n",
            Content = "",
            ContentHash = "h",
        };

        string ct = resolver.Resolve(artifact);

        ct.Should().Be(expected);
    }
}
