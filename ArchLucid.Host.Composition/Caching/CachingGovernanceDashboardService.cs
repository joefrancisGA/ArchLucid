using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Host.Composition.Caching;

/// <summary>
///     Decorates <see cref="IGovernanceDashboardService" /> with short-TTL hot-path read caching (TB-581).
/// </summary>
public sealed class CachingGovernanceDashboardService(
    IGovernanceDashboardService inner,
    IHotPathReadCache cache,
    IScopeContextProvider scopeContextProvider) : IGovernanceDashboardService
{
    /// <summary>Short TTL for governance dashboard aggregates (TB-581).</summary>
    private const int DashboardAbsoluteExpirationSeconds = 15;

    private readonly IHotPathReadCache _cache =
        cache ?? throw new ArgumentNullException(nameof(cache));

    private readonly IGovernanceDashboardService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task<GovernanceDashboardSummary> GetDashboardAsync(
        Guid tenantId,
        int maxPending = 20,
        int maxDecisions = 20,
        int maxChanges = 20,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string key = HotPathCacheKeys.GovernanceDashboard(scope, tenantId, maxPending, maxDecisions, maxChanges);

        GovernanceDashboardSummary? summary = await _cache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                GovernanceDashboardSummary result = await _inner
                    .GetDashboardAsync(tenantId, maxPending, maxDecisions, maxChanges, innerCt)
                    .ConfigureAwait(false);

                return (GovernanceDashboardSummary?)result;
            },
            cancellationToken,
            absoluteExpirationSecondsOverride: DashboardAbsoluteExpirationSeconds);

        return summary ?? throw new InvalidOperationException("Governance dashboard cache returned null unexpectedly.");
    }
}
