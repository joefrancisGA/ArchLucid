using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ItsmPullForwardOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        ItsmPullForwardOptions options = new();

        ItsmPullForwardOutputResolution resolution =
            ItsmPullForwardOutputPaths.Resolve(
                options,
                RepositoryRoot,
                ItsmPullForwardOutputPaths.DefaultArtifactKey);

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "itsm-pull-forward-gate",
                "paid-pilot-ledgers",
                "itsm-pull-forward-gate.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "itsm-pull-forward-gate",
                "paid-pilot-ledgers",
                "itsm-pull-forward-gate.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        ItsmPullForwardOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        ItsmPullForwardOutputResolution resolution =
            ItsmPullForwardOutputPaths.Resolve(options, RepositoryRoot, "custom-ledger");

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        ItsmPullForwardOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        ItsmPullForwardOutputResolution resolution =
            ItsmPullForwardOutputPaths.Resolve(options, RepositoryRoot, "paid-pilot-ledgers");

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesLedgerDirectoryNameWithoutExtension()
    {
        ItsmPullForwardReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = @"C:\repo\ArchLucid\artifacts\validation\paid-pilot-ledgers",
            GeneratedUtc = DateTime.UtcNow,
            Recommendation = ItsmPullForwardVerdict.Hold,
            Checks = [],
            Triggers = new ItsmPullForwardTriggerCounts
            {
                ConnectorPrimaryBlockerPilotCount = 0,
                SowContingentOnConnectorCount = 0,
                ManualHandoffDominatesSecondReviewCount = 0,
            },
            LedgerFilesScanned = 0,
        };

        ItsmPullForwardOutputPaths.ResolveArtifactKey(report).Should().Be("paid-pilot-ledgers");
    }

    [Fact]
    public void ResolveArtifactKey_UsesLiveApiKeyWhenBaseUrlPresent()
    {
        ItsmPullForwardReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = @"C:\repo\ArchLucid\artifacts\validation\paid-pilot-ledgers",
            BaseUrl = "http://localhost:5128",
            GeneratedUtc = DateTime.UtcNow,
            Recommendation = ItsmPullForwardVerdict.Hold,
            Checks = [],
            Triggers = new ItsmPullForwardTriggerCounts
            {
                ConnectorPrimaryBlockerPilotCount = 0,
                SowContingentOnConnectorCount = 0,
                ManualHandoffDominatesSecondReviewCount = 0,
            },
            LedgerFilesScanned = 0,
        };

        ItsmPullForwardOutputPaths.ResolveArtifactKey(report)
            .Should()
            .Be(ItsmPullForwardOutputPaths.LiveApiArtifactKey);
    }
}
