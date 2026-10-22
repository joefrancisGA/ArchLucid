using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Rules;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Rules;

[Trait("Category", "Unit")]
public sealed class DecisionRuleFindingTypeIndexTests
{
    [Fact]
    public void GetByFindingType_preserves_priority_order_without_per_finding_scan()
    {
        List<DecisionRule> rulesInPriorityOrder =
        [
            new DecisionRule { RuleId = "high-cost", AppliesToFindingType = "Cost", Priority = 100 },
            new DecisionRule { RuleId = "low-cost", AppliesToFindingType = "Cost", Priority = 10 },
            new DecisionRule { RuleId = "security", AppliesToFindingType = "Security", Priority = 50 },
        ];

        DecisionRuleFindingTypeIndex index = new(rulesInPriorityOrder);

        IReadOnlyList<DecisionRule> costRules = index.GetByFindingType("Cost");

        costRules.Should().HaveCount(2);
        costRules.Select(rule => rule.RuleId).Should().Equal("high-cost", "low-cost");
        index.GetByFindingType("Security").Should().ContainSingle(rule => rule.RuleId == "security");
        index.GetByFindingType("Missing").Should().BeEmpty();
    }
}
