using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Generators;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UnresolvedIssuesArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_serializes_unresolved_issue_items()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        IssueType = "Policy",
                        Title = "Missing backup policy",
                        Description = "No RPO defined.",
                        Severity = "High",
                    },
                ],
            },
        };

        UnresolvedIssuesArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.UnresolvedIssuesReport);
        artifact.ContentHash.Should().NotBeNullOrWhiteSpace();

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement item = doc.RootElement.GetProperty("Items")[0];
        item.GetProperty("Title").GetString().Should().Be("Missing backup policy");
        item.GetProperty("Severity").GetString().Should().Be("High");
    }
}
