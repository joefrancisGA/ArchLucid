using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Contracts.Abstractions.ProductLearning;

/// <summary>
///     Deterministic 59R bridge: materialize improvement themes and bounded plans from ranked 58R opportunities.
///     Does not mutate prompts, agents, or governance — persists human-reviewable drafts only.
/// </summary>
public interface IProductLearningPlanningDerivationService
{
    /// <summary>
    ///     For each ranked opportunity whose <c>ThemeKey</c> does not already exist in scope, inserts a theme + plan and
    ///     links matching pilot signals (bounded). Idempotent per ThemeKey.
    /// </summary>
    Task<ProductLearningPlanningMaterializeResult> MaterializeFromRankedOpportunitiesAsync(
        ProductLearningScope scope,
        ProductLearningTriageOptions options,
        string? createdByUserId,
        int maxPlansToCreate,
        CancellationToken cancellationToken);
}
