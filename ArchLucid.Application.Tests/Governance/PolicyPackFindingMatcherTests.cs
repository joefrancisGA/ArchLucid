using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackFindingMatcherTests
{
    [Fact]
    public void MatchesAssignment_uses_pack_engine_type_when_rule_keys_miss_but_finding_is_pack_attributed()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["expected-compliance-rule"],
        };

        Finding finding = new()
        {
            FindingId = "f-pack-engine",
            PolicyRuleId = "unrelated-rule-key",
            EngineType = $"policy-pack:{packId:D}",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue(
            "pack-attributed findings should still match when ComplianceRuleKeys is populated but PolicyRuleId is not a listed key");
    }

    [Fact]
    public void MatchesAssignment_does_not_treat_prefix_rule_key_as_match_for_longer_sibling_rule_id()
    {
        Guid packId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["cis-azure-1.2"],
        };

        Finding finding = new()
        {
            FindingId = "f-sibling-rule",
            PolicyRuleId = "cis-azure-1.20",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeFalse(
            "execute-time compliance keys like cis-azure-1.2 must not match findings for cis-azure-1.20 via substring");
    }

    [Fact]
    public void MatchesAssignment_matches_rule_key_embedded_in_longer_policy_rule_id_with_token_boundary()
    {
        Guid packId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["cis-azure-1.2"],
        };

        Finding finding = new()
        {
            FindingId = "f-embedded",
            PolicyRuleId = $"policy-pack-{packId:D}-cis-azure-1.2",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_canonical_n_policy_pack_id_property_as_equivalent_to_assignment()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["listed-only"],
        };

        Finding finding = new()
        {
            FindingId = "f-property-n",
            PolicyRuleId = "unrelated-rule",
            EngineType = "compliance-engine",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["policyPackId"] = packId.ToString("N"),
            },
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue(
            "finding properties may carry canonical N GUIDs while assignments use D tokens");
    }
}
