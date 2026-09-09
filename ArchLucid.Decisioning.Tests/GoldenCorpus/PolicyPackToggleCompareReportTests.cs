using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>CI guard for the pack-toggle compare quality artifact under docs/quality/.</summary>
[Trait("Suite", "Core")]
public sealed class PolicyPackToggleCompareReportTests
{
    [Fact]
    public async Task Committed_markdown_matches_captured_pack_toggle_compare()
    {
        PolicyPackToggleCompareSnapshot snapshot = await PolicyPackToggleCompareCapture.CaptureAsync(CancellationToken.None);
        string expectedMarkdown = PolicyPackToggleCompareMarkdown.Build(snapshot);

        string artifactPath = Path.Combine(
            GoldenCorpusRepoPaths.FindRepoRoot(),
            PolicyPackToggleCompareMarkdown.ArtifactRelativePath);

        File.Exists(artifactPath).Should().BeTrue(
            because: "run with ARCHLUCID_RECORD_POLICY_PACK_TOGGLE_COMPARE=1 to create the artifact");

        string committedMarkdown = await File.ReadAllTextAsync(artifactPath);

        committedMarkdown.Should().Be(expectedMarkdown);
    }

    /// <summary>
    /// Set <c>ARCHLUCID_RECORD_POLICY_PACK_TOGGLE_COMPARE=1</c> to rewrite
    /// <c>docs/quality/policy-pack-toggle-compare.md</c>.
    /// </summary>
    [Fact]
    [Trait("Category", "GoldenCorpusRecord")]
    public async Task Record_compare_markdown_when_env_flag_set()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable(PolicyPackToggleCompareMarkdown.RecordEnvironmentVariable),
                "1",
                StringComparison.Ordinal))
        {
            return;
        }

        PolicyPackToggleCompareSnapshot snapshot = await PolicyPackToggleCompareCapture.CaptureAsync(CancellationToken.None);

        string markdownPath = Path.Combine(
            GoldenCorpusRepoPaths.FindRepoRoot(),
            PolicyPackToggleCompareMarkdown.ArtifactRelativePath);

        await File.WriteAllTextAsync(markdownPath, PolicyPackToggleCompareMarkdown.Build(snapshot));
    }

    [Fact]
    public async Task Captured_compare_includes_buyer_visible_soc2_and_cis_azure_rule_ids()
    {
        PolicyPackToggleCompareSnapshot snapshot = await PolicyPackToggleCompareCapture.CaptureAsync(CancellationToken.None);

        snapshot.FilteredRuleKeyRows.Should().HaveCount(2);
        snapshot.FilteredRuleKeyRows.Select(static row => row.PolicyRuleId)
            .Should().BeEquivalentTo(["soc2-004", "cis-az-006"]);

        HashSet<string> bundledRuleIds = snapshot.BundledP1Rows
            .Select(static row => row.PolicyRuleId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        bundledRuleIds.Should().Contain("soc2-004");
        bundledRuleIds.Should().Contain("cis-az-006");
        bundledRuleIds.Should().NotBeEquivalentTo(["soc2-004"], "P1 SOC 2 vs CIS Azure must diverge");
    }

    [Fact]
    public void Compare_markdown_includes_claim_boundary_disclaimer()
    {
        string markdown = PolicyPackToggleCompareMarkdown.Build(new PolicyPackToggleCompareSnapshot
        {
            FilteredRuleKeyRows = [],
            BundledP1Rows = [],
        });

        markdown.Should().Contain(PolicyPackToggleCompareMarkdown.ClaimBoundaryMarker);
        markdown.Should().Contain("not evidence that all engines are policy-aware");
        markdown.Should().Contain("Coverage, topology, cost, and inventory engines remain pack-inert");
    }
}
