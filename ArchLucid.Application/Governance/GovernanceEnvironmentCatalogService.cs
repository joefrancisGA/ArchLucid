namespace ArchLucid.Application.Governance;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

/// <inheritdoc cref="IGovernanceEnvironmentCatalogService" />
public sealed class GovernanceEnvironmentCatalogService(
    IScopeContextProvider scopeProvider,
    IGovernanceEnvironmentCatalogRepository repository) : IGovernanceEnvironmentCatalogService
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IGovernanceEnvironmentCatalogRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    /// <inheritdoc />
    public Task<GovernanceEnvironmentCatalog> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return GetCatalogAsync(scope, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<GovernanceEnvironmentCatalog> GetCatalogAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        GovernanceEnvironmentCatalog? catalog = await _repository
            .GetByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        if (catalog is { Environments.Count: > 0 })
        {
            GovernanceEnvironmentCatalog normalized = NormalizeCatalog(catalog);
            normalized.IsAdministratorConfigured = true;

            return normalized;
        }

        GovernanceEnvironmentCatalog defaults = GovernanceEnvironmentCatalogDefaults.Create();
        defaults.IsAdministratorConfigured = false;

        return defaults;
    }

    /// <inheritdoc />
    public async Task ReplaceCatalogAsync(
        ReplaceGovernanceEnvironmentCatalogRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        GovernanceEnvironmentCatalog normalized = NormalizeCatalog(new GovernanceEnvironmentCatalog
        {
            Environments = request.Environments,
            Transitions = request.Transitions,
        });

        ValidateCatalogOrThrow(normalized);
        normalized.IsAdministratorConfigured = true;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        await _repository
            .ReplaceForScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, normalized, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<bool> IsValidTransitionAsync(
        string sourceSlug,
        string targetSlug,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await IsValidTransitionAsync(scope, sourceSlug, targetSlug, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<bool> IsValidTransitionAsync(
        ScopeContext scope,
        string sourceSlug,
        string targetSlug,
        CancellationToken cancellationToken = default)
    {
        GovernanceEnvironmentCatalog? catalog = await _repository
            .GetByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        if (catalog is { Environments.Count: > 0 })
            return GovernanceEnvironmentTransitionRules.IsValidTransition(sourceSlug, targetSlug, NormalizeCatalog(catalog));

        return GovernanceEnvironmentTransitionRules.IsValidTransition(sourceSlug, targetSlug);
    }

    public static GovernanceEnvironmentCatalog NormalizeCatalog(GovernanceEnvironmentCatalog catalog)
    {
        List<GovernanceEnvironmentDefinition> environments = catalog.Environments
            .Select(environment => new GovernanceEnvironmentDefinition
            {
                Slug = environment.Slug.Trim(),
                DisplayName = environment.DisplayName.Trim(),
                SortOrder = environment.SortOrder,
                IsActive = environment.IsActive,
            })
            .OrderBy(environment => environment.SortOrder)
            .ThenBy(environment => environment.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<GovernanceEnvironmentTransition> transitions = catalog.Transitions
            .Select(transition => new GovernanceEnvironmentTransition
            {
                SourceSlug = transition.SourceSlug.Trim(),
                TargetSlug = transition.TargetSlug.Trim(),
            })
            .ToList();

        return new GovernanceEnvironmentCatalog
        {
            IsAdministratorConfigured = catalog.IsAdministratorConfigured,
            Environments = environments,
            Transitions = transitions,
        };
    }

    public static bool CatalogContentEquals(GovernanceEnvironmentCatalog left, GovernanceEnvironmentCatalog right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        GovernanceEnvironmentCatalog normalizedLeft = NormalizeCatalog(left);
        GovernanceEnvironmentCatalog normalizedRight = NormalizeCatalog(right);

        if (normalizedLeft.Environments.Count != normalizedRight.Environments.Count
            || normalizedLeft.Transitions.Count != normalizedRight.Transitions.Count)
        {
            return false;
        }

        for (int index = 0; index < normalizedLeft.Environments.Count; index++)
        {
            GovernanceEnvironmentDefinition leftEnvironment = normalizedLeft.Environments[index];
            GovernanceEnvironmentDefinition rightEnvironment = normalizedRight.Environments[index];

            if (!string.Equals(leftEnvironment.Slug, rightEnvironment.Slug, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(leftEnvironment.DisplayName, rightEnvironment.DisplayName, StringComparison.OrdinalIgnoreCase)
                || leftEnvironment.SortOrder != rightEnvironment.SortOrder
                || leftEnvironment.IsActive != rightEnvironment.IsActive)
            {
                return false;
            }
        }

        for (int index = 0; index < normalizedLeft.Transitions.Count; index++)
        {
            GovernanceEnvironmentTransition leftTransition = normalizedLeft.Transitions[index];
            GovernanceEnvironmentTransition rightTransition = normalizedRight.Transitions[index];

            if (!string.Equals(leftTransition.SourceSlug, rightTransition.SourceSlug, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(leftTransition.TargetSlug, rightTransition.TargetSlug, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    public static void ValidateCatalogOrThrow(GovernanceEnvironmentCatalog catalog)
    {
        if (catalog.Environments.Count == 0)
            throw new ArgumentException("At least one environment definition is required.");

        if (catalog.Transitions.Count == 0)
            throw new ArgumentException("At least one environment transition is required.");

        HashSet<string> slugs = new(StringComparer.OrdinalIgnoreCase);

        foreach (GovernanceEnvironmentDefinition environment in catalog.Environments)
        {
            if (string.IsNullOrWhiteSpace(environment.Slug))
                throw new ArgumentException("Environment slug is required.");

            if (environment.Slug.Length > GovernanceEnvironmentSlug.MaxLength)
                throw new ArgumentException($"Environment slug must not exceed {GovernanceEnvironmentSlug.MaxLength} characters.");

            if (string.IsNullOrWhiteSpace(environment.DisplayName))
                throw new ArgumentException($"Display name is required for environment '{environment.Slug}'.");

            if (environment.DisplayName.Length > 200)
                throw new ArgumentException($"Display name for environment '{environment.Slug}' must not exceed 200 characters.");

            if (!slugs.Add(environment.Slug))
                throw new ArgumentException($"Duplicate environment slug '{environment.Slug}'.");
        }

        HashSet<string> activeSlugs = catalog.Environments
            .Where(environment => environment.IsActive)
            .Select(environment => environment.Slug)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (activeSlugs.Count == 0)
            throw new ArgumentException("At least one active environment is required.");

        if (catalog.Transitions.Count == 0)
            throw new ArgumentException("At least one transition is required.");

        HashSet<string> transitionEdges = new(StringComparer.OrdinalIgnoreCase);

        foreach (GovernanceEnvironmentTransition transition in catalog.Transitions)
        {
            if (string.IsNullOrWhiteSpace(transition.SourceSlug) || string.IsNullOrWhiteSpace(transition.TargetSlug))
                throw new ArgumentException("Transition source and target slugs are required.");

            if (string.Equals(transition.SourceSlug, transition.TargetSlug, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException($"Transition cannot point from '{transition.SourceSlug}' to itself.");

            if (!activeSlugs.Contains(transition.SourceSlug))
                throw new ArgumentException($"Transition source '{transition.SourceSlug}' is not an active environment.");

            if (!activeSlugs.Contains(transition.TargetSlug))
                throw new ArgumentException($"Transition target '{transition.TargetSlug}' is not an active environment.");

            string edgeKey = $"{transition.SourceSlug}->{transition.TargetSlug}";

            if (!transitionEdges.Add(edgeKey))
                throw new ArgumentException($"Duplicate transition from '{transition.SourceSlug}' to '{transition.TargetSlug}'.");
        }
    }
}
