using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReturnTriggerTelemetryOutputPathsTests
{
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        ReturnTriggerTelemetryOptions options = new();

        ReturnTriggerTelemetryOutputResolution resolution =
            ReturnTriggerTelemetryOutputPaths.Resolve(options, RepositoryRoot, "return-trigger-sessions");

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "return-trigger-telemetry",
                "return-trigger-sessions",
                "return-trigger-telemetry.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "return-trigger-telemetry",
                "return-trigger-sessions",
                "return-trigger-telemetry.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        ReturnTriggerTelemetryOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        ReturnTriggerTelemetryOutputResolution resolution =
            ReturnTriggerTelemetryOutputPaths.Resolve(options, RepositoryRoot, "custom-ledger");

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        ReturnTriggerTelemetryOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        ReturnTriggerTelemetryOutputResolution resolution =
            ReturnTriggerTelemetryOutputPaths.Resolve(options, RepositoryRoot, "return-trigger-sessions");

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesLedgerDirectoryName()
    {
        ReturnTriggerTelemetryReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = @"C:\repo\ArchLucid\fixtures\principal-architect\return-trigger-sessions",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = ReturnTriggerTelemetryVerdict.Pass,
        };

        ReturnTriggerTelemetryOutputPaths.ResolveArtifactKey(report).Should().Be("return-trigger-sessions");
    }
}
