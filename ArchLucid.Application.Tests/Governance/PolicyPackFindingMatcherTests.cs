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
            PolicyRuleId = "compliance:cis-azure-1.2",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_does_not_match_dot_extension_rule_id_for_assignment_key()
    {
        Guid packId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["cis-azure-1.2"],
        };

        Finding finding = new()
        {
            FindingId = "f-dot-extension",
            PolicyRuleId = "cis-azure-1.2.1",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeFalse(
            "distinct rule ids that extend the assignment key with identifier punctuation must not match");
    }

    [Fact]
    public void MatchesAssignment_does_not_match_underscore_extension_rule_id_for_assignment_key()
    {
        Guid packId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["cis-azure-1.2"],
        };

        Finding finding = new()
        {
            FindingId = "f-underscore-extension",
            PolicyRuleId = "cis-azure-1.2_extra",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeFalse(
            "distinct rule ids that extend the assignment key with identifier punctuation must not match");
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

    [Fact]
    public void MatchesAssignment_treats_canonical_n_pack_token_in_policy_rule_id_as_pack_attributed()
    {
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
        };

        Finding finding = new()
        {
            FindingId = "f-rule-n",
            PolicyRuleId = $"policy-pack-{packId:N}-rule-1",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_canonical_n_pack_token_in_engine_type_as_pack_attributed()
    {
        Guid packId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["listed-only"],
        };

        Finding finding = new()
        {
            FindingId = "f-engine-n",
            PolicyRuleId = "unrelated-rule",
            EngineType = $"policy-pack:{packId:N}",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_uppercase_hex_n_pack_token_in_engine_type_as_pack_attributed()
    {
        Guid packId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
        };

        Finding finding = new()
        {
            FindingId = "f-engine-upper",
            PolicyRuleId = "unrelated",
            EngineType = $"policy-pack:{packId:N}".ToUpperInvariant(),
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_outer_whitespace_on_policy_pack_engine_type_as_pack_attributed()
    {
        Guid packId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
        };

        Finding finding = new()
        {
            FindingId = "f-engine-padded",
            PolicyRuleId = "unrelated",
            EngineType = $" policy-pack:{packId:D} ",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_ascii_space_after_policy_pack_prefix_as_pack_attributed()
    {
        Guid packId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
        };

        Finding finding = new()
        {
            FindingId = "f-engine-space",
            PolicyRuleId = "unrelated",
            EngineType = $"policy-pack: {packId:D}",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue();
    }

    [Fact]
    public void MatchesAssignment_treats_outer_whitespace_on_policy_rule_id_as_listed_compliance_key()
    {
        Guid packId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        CommittedGovernancePackAssignmentSnapshot assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0",
            ComplianceRuleKeys = ["cis-azure-1.2"],
        };

        Finding finding = new()
        {
            FindingId = "f-rule-padded",
            PolicyRuleId = " cis-azure-1.2 ",
            EngineType = "compliance-engine",
        };

        PolicyPackFindingMatcher.MatchesAssignment(finding, assignment).Should().BeTrue(
            "execute-time compliance keys must match when PolicyRuleId differs only by outer whitespace");
    }
}
