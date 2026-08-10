using ArchLucid.Application.Analysis;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

/// <summary>
///     RC28 package-coverage batch: Azure Boards description builder, finding fingerprint normalization, demo/trial
///     seed id derivation, and comparison-replay payload complexity scoring.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatchRc28Tests
{
    [Fact]
    public void AzureBoardsWorkItemDescriptionBuilder_appends_deep_link_when_inputs_present()
    {
        string description = AzureBoardsWorkItemDescriptionBuilder.Build(
            "Finding body",
            "https://app.example.com/",
            "run-1",
            "finding-2");

        description.Should().StartWith("Finding body");
        description.Should().Contain("https://app.example.com/reviews/run-1/findings/finding-2");
        description.Should().Contain("ArchLucid finding (deep link)");
    }

    [Theory]
    [InlineData("body", null, "run", "finding")]
    [InlineData("body", "https://app.example.com", "", "finding")]
    [InlineData("body", "https://app.example.com", "run", "  ")]
    [InlineData(null, null, "run", "finding")]
    public void AzureBoardsWorkItemDescriptionBuilder_skips_link_when_required_parts_missing(
        string? description,
        string? publicBaseUrl,
        string runId,
        string findingId)
    {
        string result = AzureBoardsWorkItemDescriptionBuilder.Build(description, publicBaseUrl, runId, findingId);

        result.Should().Be((description ?? string.Empty).TrimEnd());
        result.Should().NotContain("ArchLucid finding");
    }

    [Fact]
    public void NormalizedFindingFingerprintNormalizer_builds_stable_fingerprint_and_dedupe_key()
    {
        ArchitectureFinding finding = new()
        {
            Category = "  Network   Security ",
            Message = "Public endpoint  exposed",
            PolicyRuleId = " rule-1 ",
        };

        string fingerprint = NormalizedFindingFingerprintNormalizer.NormalizeFingerprint(finding);
        string fuzzy = NormalizedFindingFingerprintNormalizer.NormalizeFuzzyKey(finding);
        string? dedupe = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(finding);

        fingerprint.Should().HaveLength(64);
        fingerprint.Should().MatchRegex("^[0-9a-f]+$");
        fuzzy.Should().Be("network security|public endpoint exposed");
        dedupe.Should().Be($"rule-1:{fingerprint}");

        NormalizedFindingFingerprintNormalizer.NormalizeFingerprint(finding).Should().Be(fingerprint);
    }

    [Fact]
    public void NormalizedFindingFingerprintNormalizer_TryBuildDedupeKey_returns_null_without_policy_rule()
    {
        ArchitectureFinding finding = new()
        {
            Category = "Cost",
            Message = "Overprovisioned SKU",
            PolicyRuleId = "  ",
        };

        NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(finding).Should().BeNull();
    }

    [Fact]
    public void NormalizedFindingFingerprintNormalizer_rejects_null_finding()
    {
        FluentActions
            .Invoking(() => NormalizedFindingFingerprintNormalizer.NormalizeFingerprint(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void AuthorityDemoChainIds_are_stable_and_purpose_distinct()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Guid manifest = AuthorityDemoChainIds.Manifest(runId);
        Guid context = AuthorityDemoChainIds.ContextSnapshot(runId);
        Guid graph = AuthorityDemoChainIds.GraphSnapshot(runId);
        Guid findings = AuthorityDemoChainIds.FindingsSnapshot(runId);
        Guid decision = AuthorityDemoChainIds.DecisionTrace(runId);

        AuthorityDemoChainIds.Manifest(runId).Should().Be(manifest);
        new[] { manifest, context, graph, findings, decision }.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void TrialWelcomeSeedIds_are_stable_and_purpose_distinct()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Guid analysis = TrialWelcomeSeedIds.AnalysisArtifactId(runId);
        Guid bundle = TrialWelcomeSeedIds.ArtifactBundleId(runId);

        TrialWelcomeSeedIds.AnalysisArtifactId(runId).Should().Be(analysis);
        analysis.Should().NotBe(bundle);
    }

    [Fact]
    public void ComparisonReplayPayloadComplexity_scores_empty_payload_as_zero()
    {
        List<string> factors = [];

        int bump = ComparisonReplayPayloadComplexity.ScorePayloadComplexity("  ", factors);

        bump.Should().Be(0);
        factors.Should().BeEmpty();
    }

    [Fact]
    public void ComparisonReplayPayloadComplexity_scores_manifest_diff_lists()
    {
        const string json =
            """
            {
              "manifestDiff": {
                "addedServices": ["a", "b", "c", "d"],
                "removedServices": ["e"],
                "addedDatastores": ["f", "g"],
                "removedDatastores": [],
                "addedRequiredControls": ["x", "y", "z"],
                "removedRequiredControls": ["w"],
                "addedRelationships": ["r1", "r2"],
                "removedRelationships": ["r3"]
              }
            }
            """;
        List<string> factors = [];

        int bump = ComparisonReplayPayloadComplexity.ScorePayloadComplexity(json, factors);

        bump.Should().BeGreaterThan(0);
        factors.Should().Contain(f => f.Contains("Manifest", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ComparisonReplayPayloadComplexity_scores_invalid_json_as_one()
    {
        List<string> factors = [];

        int bump = ComparisonReplayPayloadComplexity.ScorePayloadComplexity("{not-json", factors);

        bump.Should().Be(1);
        factors.Should().Contain(f => f.Contains("not structured", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ComparisonReplayPayloadComplexity_rejects_null_factors()
    {
        FluentActions
            .Invoking(() => ComparisonReplayPayloadComplexity.ScorePayloadComplexity("{}", null!))
            .Should()
            .Throw<ArgumentNullException>();
    }
}
