namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Validates governance environment transitions against a static ladder or an administrator catalog.
/// </summary>
public static class GovernanceEnvironmentTransitionRules
{
    /// <summary>
    ///     Returns <see langword="true" /> when <paramref name="target" /> is a permitted transition from
    ///     <paramref name="source" /> according to <paramref name="catalog" /> or the built-in ladder fallback.
    /// </summary>
    public static bool IsValidTransition(
        string source,
        string target,
        GovernanceEnvironmentCatalog? catalog = null)
    {
        if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(target))
            return false;

        if (string.Equals(source, target, StringComparison.OrdinalIgnoreCase))
            return false;

        if (catalog is { Environments.Count: > 0 })
            return IsValidCatalogTransition(source, target, catalog);

        return GovernanceEnvironmentOrder.IsValidPromotion(source, target);
    }

    private static bool IsValidCatalogTransition(
        string source,
        string target,
        GovernanceEnvironmentCatalog catalog)
    {
        HashSet<string> activeSlugs = catalog.Environments
            .Where(environment => environment.IsActive)
            .Select(environment => environment.Slug)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!activeSlugs.Contains(source) || !activeSlugs.Contains(target))
            return false;

        return catalog.Transitions.Any(transition =>
            string.Equals(transition.SourceSlug, source, StringComparison.OrdinalIgnoreCase)
            && string.Equals(transition.TargetSlug, target, StringComparison.OrdinalIgnoreCase));
    }
}
