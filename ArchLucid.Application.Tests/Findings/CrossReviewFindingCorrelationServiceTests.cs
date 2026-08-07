using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CrossReviewFindingCorrelationServiceTests
{
    private readonly CrossReviewFindingCorrelationService _sut = new();

    [SkippableFact]
    public void Correlate_usesPolicyRuleFingerprint_whenBothSidesExposePolicyRule()
    {
        ArchitectureFinding left = Finding("left-1", "rule-a", "Security", "Public storage");
        ArchitectureFinding right = Finding("right-1", "rule-a", "Security", "Public storage");

        CrossReviewFindingCorrelationResult result = _sut.Correlate([left], [right]);

        result.MatchedPairs.Should().ContainSingle();
        result.MatchedPairs[0].Method.Should().Be(FindingCorrelationMethod.PolicyRuleAndFingerprint);
        result.PolicyRuleMatchCount.Should().Be(1);
        result.FuzzyMatchCount.Should().Be(0);
    }

    [SkippableFact]
    public void Correlate_usesFuzzyMatch_whenPolicyRuleMissing_andLabelsPossibleMatch()
    {
        ArchitectureFinding left = Finding("left-1", policyRuleId: null, "Security", "Public storage");
        ArchitectureFinding right = Finding("right-1", policyRuleId: null, "Security", "Public storage");

        CrossReviewFindingCorrelationResult result = _sut.Correlate([left], [right]);

        result.MatchedPairs.Should().ContainSingle();
        result.MatchedPairs[0].Method.Should().Be(FindingCorrelationMethod.MessageCategoryFuzzy);
        result.FuzzyMatchCount.Should().Be(1);
    }

  private static ArchitectureFinding Finding(
        string findingId,
        string? policyRuleId,
        string category,
        string message) =>
        new()
        {
            FindingId = findingId,
            PolicyRuleId = policyRuleId,
            Category = category,
            Message = message,
        };
}
