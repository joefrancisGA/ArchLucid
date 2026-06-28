using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CitationIntegrityOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        CitationIntegrityOptions options = new();

        CitationIntegrityOutputResolution resolution =
            CitationIntegrityOutputPaths.Resolve(
                options,
                RepositoryRoot,
                CitationIntegrityOutputPaths.OfflineArtifactKey);

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "citation-integrity",
                "offline-fixture",
                "citation-integrity.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "citation-integrity",
                "offline-fixture",
                "citation-integrity.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        CitationIntegrityOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        CitationIntegrityOutputResolution resolution =
            CitationIntegrityOutputPaths.Resolve(
                options,
                RepositoryRoot,
                CitationIntegrityOutputPaths.LiveApiArtifactKey);

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        CitationIntegrityOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        CitationIntegrityOutputResolution resolution =
            CitationIntegrityOutputPaths.Resolve(
                options,
                RepositoryRoot,
                CitationIntegrityOutputPaths.LiveApiArtifactKey);

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesLiveApiKeyWhenBaseUrlPresent()
    {
        CitationIntegrityReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            BaseUrl = "https://pilot.archlucid.test",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = CitationIntegrityVerdict.Pass,
            FailThreshold = 1,
        };

        CitationIntegrityOutputPaths.ResolveArtifactKey(report)
            .Should()
            .Be(CitationIntegrityOutputPaths.LiveApiArtifactKey);
    }
}
