using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Rules;

/// <summary>
///     Groups decision rules by <see cref="DecisionRule.AppliesToFindingType" /> in priority order (TB-589).
/// </summary>
public sealed class DecisionRuleFindingTypeIndex
{
    private readonly Dictionary<string, List<DecisionRule>> _byFindingType;

    public DecisionRuleFindingTypeIndex(IReadOnlyList<DecisionRule> rulesInPriorityOrder)
    {
        ArgumentNullException.ThrowIfNull(rulesInPriorityOrder);

        _byFindingType = new Dictionary<string, List<DecisionRule>>(StringComparer.OrdinalIgnoreCase);

        foreach (DecisionRule rule in rulesInPriorityOrder)
        {
            if (string.IsNullOrWhiteSpace(rule.AppliesToFindingType))
                continue;

            if (!_byFindingType.TryGetValue(rule.AppliesToFindingType, out List<DecisionRule>? bucket))
            {
                bucket = [];
                _byFindingType[rule.AppliesToFindingType] = bucket;
            }

            bucket.Add(rule);
        }
    }

    public IReadOnlyList<DecisionRule> GetByFindingType(string? findingType)
    {
        if (string.IsNullOrWhiteSpace(findingType))
            return Array.Empty<DecisionRule>();

        if (_byFindingType.TryGetValue(findingType, out List<DecisionRule>? bucket))
            return bucket;

        return Array.Empty<DecisionRule>();
    }
}
