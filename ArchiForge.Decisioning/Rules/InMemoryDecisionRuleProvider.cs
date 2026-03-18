using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Rules;

public class InMemoryDecisionRuleProvider : IDecisionRuleProvider
{
    public Task<DecisionRuleSet> GetRuleSetAsync(CancellationToken ct)
    {
        var ruleSet = new DecisionRuleSet
        {
            RuleSetId = "in-memory",
            Version = "1",
            Rules = new List<DecisionRule>
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
            }
        };

        ruleSet.ComputeHash();
        return Task.FromResult(ruleSet);
    }
}

