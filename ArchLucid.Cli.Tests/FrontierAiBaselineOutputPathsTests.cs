using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FrontierAiBaselineOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        FrontierAiBaselineOptions options = new();

        FrontierAiBaselineOutputResolution resolution =
            FrontierAiBaselineOutputPaths.Resolve(
                options,
                RepositoryRoot,
                FrontierAiBaselineOutputPaths.DefaultArtifactKey);

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "frontier-ai-baseline",
                "frontier-ai-scoreboard",
                "frontier-ai-baseline.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "frontier-ai-baseline",
                "frontier-ai-scoreboard",
                "frontier-ai-baseline.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        FrontierAiBaselineOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        FrontierAiBaselineOutputResolution resolution =
            FrontierAiBaselineOutputPaths.Resolve(options, RepositoryRoot, "custom-scoreboard");

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        FrontierAiBaselineOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        FrontierAiBaselineOutputResolution resolution =
            FrontierAiBaselineOutputPaths.Resolve(options, RepositoryRoot, "frontier-ai-scoreboard");

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesScoreboardFileNameWithoutExtension()
    {
        FrontierAiBaselineReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            ScoreboardPath = @"C:\repo\ArchLucid\artifacts\bakeoff\scoreboard\frontier-ai-scoreboard.md",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = FrontierAiBaselineVerdict.Pass,
            Checks = [],
            Sessions = [],
        };

        FrontierAiBaselineOutputPaths.ResolveArtifactKey(report).Should().Be("frontier-ai-scoreboard");
    }
}
