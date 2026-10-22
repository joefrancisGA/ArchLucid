using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackPriorityFloorFilterRulesCoercionTests
{
    [Fact]
    public void FilterRules_string_encoded_whole_number_rule_priority_honors_floor()
    {
        List<ComplianceRule> rules =
        [
            new() { RuleId = "p0", Priority = "0.0" },
            new() { RuleId = "p2", Priority = "2.0" },
        ];

        IReadOnlyList<ComplianceRule> filtered = PolicyPackPriorityFloor.FilterRules(rules, "1");

        filtered.Select(r => r.RuleId).Should().Equal("p0");
    }

    [Fact]
    public void TryMapToComplianceRule_string_encoded_whole_number_priority_maps_p2()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule",
            Priority = "2.0",
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Priority.Should().Be(PolicyPackRulePriority.P2);
    }
}
