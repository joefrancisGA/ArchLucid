using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Interfaces;

public interface IDecisionRuleProvider
{
    Task<IReadOnlyList<DecisionRule>> GetRulesAsync(CancellationToken ct);
}

