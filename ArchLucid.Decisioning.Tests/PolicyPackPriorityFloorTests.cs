using ArchLucid.Contracts.Compliance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackPriorityFloorTests
{
    private static ComplianceRule Rule(string id, string priority) =>
        new()
        {
            RuleId = id,
            ControlId = id,
            ControlName = id,
            AppliesToCategory = "c",
            RequiredNodeType = string.Empty,
            RequiredEdgeType = string.Empty,
            Description = "d",
            Priority = priority,
        };

    [Fact]
    public void ResolveFloor_WhenUnset_ReturnsP2()
    {
        PolicyPackContentDocument effective = new();

        PolicyPackPriorityFloor.ResolveFloor(effective).Should().Be(PolicyPackRulePriority.P2);
    }

    [Fact]
    public void ResolveFloor_ReadsAdvisoryDefaults()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults = { [PolicyPackRulePriority.AdvisoryDefaultsKey] = "P0" },
        };

        PolicyPackPriorityFloor.ResolveFloor(effective).Should().Be(PolicyPackRulePriority.P0);
    }

    [Fact]
    public void FilterRules_P0Floor_IncludesOnlyP0()
    {
        List<ComplianceRule> rules =
        [
            Rule("a", PolicyPackRulePriority.P0),
            Rule("b", PolicyPackRulePriority.P1),
            Rule("c", PolicyPackRulePriority.P2),
        ];

        IReadOnlyList<ComplianceRule> filtered = PolicyPackPriorityFloor.FilterRules(rules, PolicyPackRulePriority.P0);

        filtered.Select(r => r.RuleId).Should().BeEquivalentTo("a");
    }

    [Fact]
    public void FilterRules_P2Floor_IncludesAllTiers()
    {
        List<ComplianceRule> rules =
        [
            Rule("a", PolicyPackRulePriority.P0),
            Rule("b", PolicyPackRulePriority.P1),
            Rule("c", PolicyPackRulePriority.P2),
        ];

        IReadOnlyList<ComplianceRule> filtered = PolicyPackPriorityFloor.FilterRules(rules, PolicyPackRulePriority.P2);

        filtered.Should().HaveCount(3);
    }

    [Fact]
    public void ComplianceFilter_AppliesPriorityFloor_WhenNoKeyRestrictions()
    {
        ComplianceRulePack source = new()
        {
            RulePackId = "p",
            Name = "n",
            Version = "1",
            Rules =
            [
                Rule("p0", PolicyPackRulePriority.P0),
                Rule("p1", PolicyPackRulePriority.P1),
            ],
        };
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults = { [PolicyPackRulePriority.AdvisoryDefaultsKey] = "P0" },
        };

        ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(source, effective);

        filtered.Rules.Should().ContainSingle(r => r.RuleId == "p0");
    }
}
