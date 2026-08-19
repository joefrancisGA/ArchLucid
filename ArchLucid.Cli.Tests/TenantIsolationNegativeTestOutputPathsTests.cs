using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantIsolationNegativeTestOutputPathsTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        TenantIsolationNegativeTestOptions options = new();

        TenantIsolationNegativeTestOutputResolution resolution =
            TenantIsolationNegativeTestOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "tenant-isolation-negative-test",
                RunId,
                "tenant-isolation-negative-test.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "tenant-isolation-negative-test",
                RunId,
                "tenant-isolation-negative-test.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        TenantIsolationNegativeTestOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        TenantIsolationNegativeTestOutputResolution resolution =
            TenantIsolationNegativeTestOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        TenantIsolationNegativeTestOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        TenantIsolationNegativeTestOutputResolution resolution =
            TenantIsolationNegativeTestOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesOfflineKeyWhenRunIdMissing()
    {
        TenantIsolationNegativeTestReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = TenantIsolationNegativeTestVerdict.Pass,
            LiveApiMode = false,
        };

        TenantIsolationNegativeTestOutputPaths.ResolveArtifactKey(report)
            .Should()
            .Be(TenantIsolationNegativeTestOutputPaths.OfflineArtifactKey);
    }
}
