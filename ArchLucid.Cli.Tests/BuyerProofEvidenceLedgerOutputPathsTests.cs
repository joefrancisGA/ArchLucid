using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerProofEvidenceLedgerOutputPathsTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string RepositoryRoot = @"C:\repo\ArchLucid";

    [Fact]
    public void Resolve_WithoutExplicitPaths_WritesDefaultArtifactsUnderRepositoryRoot()
    {
        BuyerProofEvidenceLedgerOptions options = new();

        BuyerProofEvidenceLedgerOutputResolution resolution =
            BuyerProofEvidenceLedgerOutputPaths.Resolve(options, RepositoryRoot, "sample-proof-pack");

        resolution.JsonPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "buyer-proof-evidence-ledger",
                "sample-proof-pack",
                "buyer-proof-evidence-ledger.json"));
        resolution.MarkdownPath.Should().Be(
            Path.Combine(
                RepositoryRoot,
                "artifacts",
                "buyer-proof-evidence-ledger",
                "sample-proof-pack",
                "buyer-proof-evidence-ledger.md"));
        resolution.WillWriteJson.Should().BeTrue();
        resolution.WillWriteMarkdown.Should().BeTrue();
    }

    [Fact]
    public void Resolve_WithExplicitPaths_PrefersExplicitOutputs()
    {
        BuyerProofEvidenceLedgerOptions options = new()
        {
            JsonOutPath = @"C:\tmp\custom.json",
            MarkdownOutPath = @"C:\tmp\custom.md",
        };

        BuyerProofEvidenceLedgerOutputResolution resolution =
            BuyerProofEvidenceLedgerOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().Be(@"C:\tmp\custom.json");
        resolution.MarkdownPath.Should().Be(@"C:\tmp\custom.md");
    }

    [Fact]
    public void Resolve_WithNoWriteArtifactsFlag_SkipsDefaultOutputs()
    {
        BuyerProofEvidenceLedgerOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        BuyerProofEvidenceLedgerOutputResolution resolution =
            BuyerProofEvidenceLedgerOutputPaths.Resolve(options, RepositoryRoot, RunId);

        resolution.JsonPath.Should().BeNull();
        resolution.MarkdownPath.Should().BeNull();
    }

    [Fact]
    public void ResolveArtifactKey_UsesRunIdWhenPresent()
    {
        BuyerProofEvidenceLedgerReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            ProofDirectory = @"C:\repo\ArchLucid\fixtures\buyer-proof-evidence\sample-proof-pack",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = BuyerProofEvidenceLedgerVerdict.Pass,
            RunId = RunId,
        };

        BuyerProofEvidenceLedgerOutputPaths.ResolveArtifactKey(report).Should().Be(RunId);
    }

    [Fact]
    public void ResolveArtifactKey_UsesProofDirectoryNameWhenRunIdMissing()
    {
        BuyerProofEvidenceLedgerReport report = new()
        {
            RepositoryRoot = RepositoryRoot,
            ProofDirectory = @"C:\repo\ArchLucid\fixtures\buyer-proof-evidence\sample-proof-pack",
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = BuyerProofEvidenceLedgerVerdict.Pass,
        };

        BuyerProofEvidenceLedgerOutputPaths.ResolveArtifactKey(report).Should().Be("sample-proof-pack");
    }
}
