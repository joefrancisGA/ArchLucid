using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Rules;

public class InMemoryDecisionRuleProvider : IDecisionRuleProvider
{
    public Task<IReadOnlyList<DecisionRule>> GetRulesAsync(CancellationToken ct)
    {
        IReadOnlyList<DecisionRule> rules = new List<DecisionRule>
        {
            new DecisionRule
            {
                Name = "Promote requirement findings",
                Priority = 100,
                IsMandatory = true,
                AppliesToFindingType = "RequirementFinding",
                Action = "require"
            },
            new DecisionRule
            {
                Name = "Warn on topology gaps",
                Priority = 90,
                IsMandatory = false,
                AppliesToFindingType = "TopologyGap",
                Action = "allow"
            }
        };

        return Task.FromResult(rules);
    }
}

