using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramArtifactExtractorTests
{
    [Fact]
    public void TryGetDiagramSource_prefers_explicit_mermaid_artifact_and_respects_truncation_cap()
    {
        List<SynthesizedArtifact> artifacts =
        [
            new()
            {
                Name = "readme.txt",
                Content = "nope",
                Format = "text",
                ContentHash = "",
                ArtifactType = "Misc",
                ArtifactId = Guid.NewGuid(),
            },
            new()
            {
                Name = "architecture.mmd",
                Content = new string('x', 20),
                Format = "text",
                ContentHash = "",
                ArtifactType = "MermaidDiagram",
                ArtifactId = Guid.NewGuid(),
            },
        ];

        MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts, maxChars: 10).Should().Be("xxxxxxxxxx\n\n… (truncated)");
        MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts).Should().Be(new string('x', 20));
    }

    [Fact]
    public void TryGetDiagramSource_returns_null_when_bundle_has_no_candidates()
    {
        List<SynthesizedArtifact> artifacts =
        [
            new()
            {
                Name = "a.txt",
                Content = "",
                Format = "text",
                ContentHash = "",
                ArtifactType = "",
                ArtifactId = Guid.NewGuid(),
            },
        ];

        MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts).Should().BeNull();
    }
}
