using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingCorrelationKeyCompatibilityTests
{
    private const string SecurityFingerprint = "43d13217b2e69a2e99d1d847c1547915441f262e26b1d6048d7767f61809377e";

    [Theory]
    [InlineData("  Rule-A\t", "Rule-A", "rule-a")]
    [InlineData(" RULE-B ", "RULE-B", "rule-b")]
    [InlineData("Rule:Child", "Rule:Child", "rule:child")]
    public void PolicyRuleKeys_PreserveLegacyFormats(string policyRuleId, string crossReviewRule, string snapshotRule)
    {
        ArchitectureFinding architectureFinding = new()
        {
            FindingId = "legacy-review-id",
            PolicyRuleId = policyRuleId,
            Category = "  Security\u00a0",
            Message = " PUBLIC\t\nStorage ",
        };
        Finding snapshotFinding = new()
        {
            FindingId = "legacy-snapshot-id",
            PolicyRuleId = policyRuleId,
            Category = "SECURITY",
            Title = "Public  storage",
        };

        Assert.Equal(SecurityFingerprint, NormalizedFindingFingerprintNormalizer.NormalizeFingerprint(architectureFinding));
        Assert.Equal(SecurityFingerprint, FindingSnapshotMergeKey.NormalizeFingerprint(snapshotFinding.Category, snapshotFinding.Title));
        Assert.Equal(crossReviewRule + ":" + SecurityFingerprint,
            NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(architectureFinding));
        Assert.Equal(snapshotRule + ":" + SecurityFingerprint, FindingSnapshotMergeKey.FromFinding(snapshotFinding));
        Assert.Equal("legacy-review-id", architectureFinding.FindingId);
        Assert.Equal("legacy-snapshot-id", snapshotFinding.FindingId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t\u00a0")]
    public void MissingPolicyRule_PreservesTheUnhashedFuzzyFallback(string? policyRuleId)
    {
        ArchitectureFinding architectureFinding = new()
        {
            PolicyRuleId = policyRuleId,
            Category = " \t ",
            Message = " PUBLIC\n STORAGE ",
        };
        Finding snapshotFinding = new()
        {
            PolicyRuleId = policyRuleId,
            Category = "",
            Title = "public storage",
        };

        Assert.Null(NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(architectureFinding));
        Assert.Equal("|public storage", NormalizedFindingFingerprintNormalizer.NormalizeFuzzyKey(architectureFinding));
        Assert.Equal("|public storage", FindingSnapshotMergeKey.FromFinding(snapshotFinding));
    }

    [Fact]
    public void Correlation_MatchesRuleCaseVariantsButKeepsTheLegacyEmittedKey()
    {
        ArchitectureFinding left = new()
        {
            FindingId = "left-id",
            PolicyRuleId = "RULE-A",
            Category = "Security",
            Message = "Public storage",
        };
        ArchitectureFinding right = new()
        {
            FindingId = "right-id",
            PolicyRuleId = "rule-a",
            Category = left.Category,
            Message = left.Message,
        };

        CrossReviewFindingCorrelationResult result = new CrossReviewFindingCorrelationService().Correlate([left], [right]);

        FindingCorrelationPair match = Assert.Single(result.MatchedPairs);
        Assert.Equal(FindingCorrelationMethod.PolicyRuleAndFingerprint, match.Method);
        Assert.Equal("RULE-A:" + SecurityFingerprint, match.DedupeKey);
        Assert.Equal("left-id", match.LeftFindingId);
        Assert.Equal("right-id", match.RightFindingId);
    }
}
