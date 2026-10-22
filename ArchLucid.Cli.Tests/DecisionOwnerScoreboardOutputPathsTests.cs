using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisionOwnerScoreboardOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        DecisionOwnerScoreboardOptions options = new();

        DecisionOwnerScoreboardOutputResolution resolution =
            DecisionOwnerScoreboardOutputPaths.Resolve(options, RepositoryRoot, "sample-ledgers");

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "decision-owner-scoreboard",
                "sample-ledgers",
                "decision-owner-scoreboard.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "decision-owner-scoreboard",
                "sample-ledgers",
                "decision-owner-scoreboard.md"));
        resolution.SponsorMarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "decision-owner-scoreboard",
                "sample-ledgers",
                "decision-owner-scoreboard-sponsor.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
        resolution.WillWriteSponsorMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        DecisionOwnerScoreboardOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
            SponsorMarkdownOutPath = @"C:\tmp\custom-sponsor.md",
        };

        DecisionOwnerScoreboardOutputResolution resolution =
            DecisionOwnerScoreboardOutputPaths.Resolve(options, RepositoryRoot, "sample-ledgers");

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
        resolution.SponsorMarkdownPath.Should().Be(@"C:\tmp\custom-sponsor.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        DecisionOwnerScoreboardOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        DecisionOwnerScoreboardOutputResolution resolution =
            DecisionOwnerScoreboardOutputPaths.Resolve(options, RepositoryRoot, "sample-ledgers");

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
        resolution.SponsorMarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesLedgerDirectoryName()
    {
        DecisionOwnerScoreboardReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = @"C:\repo\ArchLucid\fixtures\decision-owner-scoreboard\sample-ledgers",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = DecisionOwnerScoreboardVerdict.Pass,
        };

        DecisionOwnerScoreboardOutputPaths.ResolveArtifactKey(report).Should().Be("sample-ledgers");
    }
}
