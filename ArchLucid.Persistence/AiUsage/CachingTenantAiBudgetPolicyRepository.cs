using ArchLucid.Core.AiUsage;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.AiUsage;

/// <summary>Decorates <see cref="ITenantAiBudgetPolicyRepository" /> for pre-call / budget status reads.</summary>
public sealed class CachingTenantAiBudgetPolicyRepository(
    ITenantAiBudgetPolicyRepository inner,
    IHotPathReadCache hotPathReadCache) : ITenantAiBudgetPolicyRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantAiBudgetPolicyRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantAiBudgetPolicy(tenantId),
            innerCt => _inner.GetByTenantIdAsync(tenantId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        decimal budgetAmountUsd,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default)
    {
        bool inserted = await _inner.EnsureDefaultTrialPolicyIfAbsentAsync(
            tenantId,
            budgetAmountUsd,
            trialExpirationUtc,
            cancellationToken);

        if (inserted)
            await HotPathCacheEviction.RemoveTenantAiBudgetPolicyAsync(_hotPathReadCache, tenantId, cancellationToken);

        return inserted;
    }
}
