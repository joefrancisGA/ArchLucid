using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateEvidenceOutputPathsTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        ShipGateEvidenceOptions options = new()
        {
            RunId = RunId,
        };

        ShipGateEvidenceOutputResolution resolution = ShipGateEvidenceOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().Be(
            Path.Combine(RepositoryRoot, "artifacts", "ship-gate-evidence", RunId, "ship-gate-evidence.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(RepositoryRoot, "artifacts", "ship-gate-evidence", RunId, "ship-gate-evidence.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        ShipGateEvidenceOptions options = new()
        {
            RunId = RunId,
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        ShipGateEvidenceOutputResolution resolution = ShipGateEvidenceOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        ShipGateEvidenceOptions options = new()
        {
            RunId = RunId,
            SuppressDefaultArtifacts = true,
        };

        ShipGateEvidenceOutputResolution resolution = ShipGateEvidenceOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void Resolve_WithoutRepositoryRoot_SkipsDefaultOutputs()
    {
        ShipGateEvidenceOptions options = new()
        {
            RunId = RunId,
        };

        ShipGateEvidenceOutputResolution resolution = ShipGateEvidenceOutputPaths.Resolve(options, repositoryRoot: null, RunId);

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }
}
