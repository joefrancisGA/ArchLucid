using System.Data;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     Decorates <see cref="IPolicyPackVersionRepository" /> so version ContentJson is not re-read on every
///     effective-governance resolve.
/// </summary>
public sealed class CachingPolicyPackVersionRepository(
    IPolicyPackVersionRepository inner,
    IHotPathReadCache hotPathReadCache) : IPolicyPackVersionRepository
{
    /// <summary>Versions are immutable after publish; allow a longer TTL than default hot-path reads.</summary>
    private const int VersionAbsoluteExpirationSeconds = 300;

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IPolicyPackVersionRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task CreateAsync(
        PolicyPackVersion version,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(version);

        await _inner.CreateAsync(version, ct, connection, transaction);
        await HotPathCacheEviction.RemovePolicyPackVersionAsync(
            _hotPathReadCache,
            version.PolicyPackId,
            version.Version,
            ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(PolicyPackVersion version, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(version);

        await _inner.UpdateAsync(version, ct);
        await HotPathCacheEviction.RemovePolicyPackVersionAsync(
            _hotPathReadCache,
            version.PolicyPackId,
            version.Version,
            ct);
    }

    /// <inheritdoc />
    public Task<PolicyPackVersion?> GetByPackAndVersionAsync(
        Guid policyPackId,
        string version,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(version);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.PolicyPackVersion(policyPackId, version),
            innerCt => _inner.GetByPackAndVersionAsync(policyPackId, version, innerCt),
            ct,
            absoluteExpirationSecondsOverride: VersionAbsoluteExpirationSeconds);
    }

    /// <inheritdoc />
    public async Task<(PolicyPackVersion Version, string? PreviousContentJson)> UpsertPublishedVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct)
    {
        (PolicyPackVersion published, string? previous) =
            await _inner.UpsertPublishedVersionAsync(policyPackId, version, contentJson, ct);

        await HotPathCacheEviction.RemovePolicyPackVersionAsync(_hotPathReadCache, policyPackId, version, ct);

        return (published, previous);
    }

    /// <inheritdoc />
    /// <remarks>
    ///     Caches metadata-only rows (empty <c>ContentJson</c>). Full bodies stay on the
    ///     <see cref="GetByPackAndVersionAsync" /> cache key.
    /// </remarks>
    public async Task<IReadOnlyList<PolicyPackVersion>> ListByPackAsync(Guid policyPackId, CancellationToken ct)
    {
        CachedPolicyPackVersionList? cached = await _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.PolicyPackVersionList(policyPackId),
            async innerCt =>
            {
                IReadOnlyList<PolicyPackVersion> rows = await _inner.ListByPackAsync(policyPackId, innerCt);

                List<PolicyPackVersion> slim = rows
                    .Select(static row => new PolicyPackVersion
                    {
                        PolicyPackVersionId = row.PolicyPackVersionId,
                        PolicyPackId = row.PolicyPackId,
                        Version = row.Version,
                        ContentJson = string.Empty,
                        CreatedUtc = row.CreatedUtc,
                        IsPublished = row.IsPublished,
                    })
                    .ToList();

                return new CachedPolicyPackVersionList { Items = slim };
            },
            ct,
            absoluteExpirationSecondsOverride: VersionAbsoluteExpirationSeconds);

        return cached?.Items ?? [];
    }
}

/// <summary>Concrete list wrapper so HybridCache can round-trip version rows.</summary>
public sealed class CachedPolicyPackVersionList
{
    public List<PolicyPackVersion> Items
    {
        get;
        init;
    } = [];
}
