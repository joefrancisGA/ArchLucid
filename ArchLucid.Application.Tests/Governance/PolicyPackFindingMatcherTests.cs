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
}
