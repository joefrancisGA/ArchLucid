using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotReadinessBundleOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        PilotReadinessBundleOptions options = new();

        PilotReadinessBundleOutputResolution resolution =
            PilotReadinessBundleOutputPaths.Resolve(
                options,
                RepositoryRoot,
                PilotReadinessBundleOutputPaths.OfflineArtifactKey);

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "pilot-readiness-bundle",
                "offline-fixture",
                "pilot-readiness-bundle.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "pilot-readiness-bundle",
                "offline-fixture",
                "pilot-readiness-bundle.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithRunId_KeysArtifactsByRunId()
    {
        PilotReadinessBundleOptions options = new()
        {
            RunId = "aaaaaaaa-1111-1111-1111-111111111111",
        };

        PilotReadinessBundleOutputResolution resolution =
            PilotReadinessBundleOutputPaths.Resolve(
                options,
                RepositoryRoot,
                options.RunId);

        resolution.JsonPath.Should().Contain("aaaaaaaa-1111-1111-1111-111111111111");
        resolution.MarkdownPath.Should().Contain("aaaaaaaa-1111-1111-1111-111111111111");
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        PilotReadinessBundleOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        PilotReadinessBundleOutputResolution resolution =
            PilotReadinessBundleOutputPaths.Resolve(options, RepositoryRoot, "offline-fixture");

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        PilotReadinessBundleOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        PilotReadinessBundleOutputResolution resolution =
            PilotReadinessBundleOutputPaths.Resolve(options, RepositoryRoot, "offline-fixture");

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesRunIdWhenPresent()
    {
        PilotReadinessBundleReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            RunId = "bbbbbbbb-2222-2222-2222-222222222222",
            OverallVerdict = PilotReadinessBundleVerdict.Pass,
            Slots = [],
        };

        PilotReadinessBundleOutputPaths.ResolveArtifactKey(report)
            .Should()
            .Be("bbbbbbbb-2222-2222-2222-222222222222");
    }

    [Fact]
    public void ResolveArtifactKey_UsesOfflineKeyWhenRunIdMissing()
    {
        PilotReadinessBundleReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = PilotReadinessBundleVerdict.Pass,
            Slots = [],
        };

        PilotReadinessBundleOutputPaths.ResolveArtifactKey(report)
            .Should()
            .Be(PilotReadinessBundleOutputPaths.OfflineArtifactKey);
    }
}
