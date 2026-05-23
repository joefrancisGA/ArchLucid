using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="IGoldenManifestRepository" /> with scoped hot-path reads and evicts on
///     <see cref="SaveAsync" />.
/// </summary>
public sealed class CachingGoldenManifestRepository(
    IGoldenManifestRepository inner,
    IHotPathReadCache hotPathReadCache) : IGoldenManifestRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IGoldenManifestRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task SaveAsync(
        ManifestDocument manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.SaveAsync(manifest, ct, connection, transaction);

        await HotPathCacheEviction.RemoveManifestAsync(_hotPathReadCache, AmbientScope(manifest), manifest.ManifestId,
            ct);
    }

    /// <inheritdoc />
    public async Task<ManifestDocument> SaveAsync(
        Contracts.Manifest.GoldenManifest contract,
        ScopeContext scope,
        SaveContractsManifestOptions keying,
        IManifestHashService manifestHashService,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null,
        ManifestDocument? authorityPersistBody = null)
    {
        ManifestDocument result = await _inner.SaveAsync(
            contract,
            scope,
            keying,
            manifestHashService,
            ct,
            connection,
            transaction,
            authorityPersistBody);
        await HotPathCacheEviction.RemoveManifestAsync(_hotPathReadCache, scope, result.ManifestId, ct);
        return result;
    }

    /// <inheritdoc />
    public Task<ManifestDocument?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string key = HotPathCacheKeys.Manifest(scope, manifestId);

        return _hotPathReadCache.GetOrCreateAsync(
            key,
            innerCt => _inner.GetByIdAsync(scope, manifestId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<ManifestDocument?> GetByContractManifestVersionAsync(ScopeContext scope, string manifestVersion,
        CancellationToken ct)
    {
        return _inner.GetByContractManifestVersionAsync(scope, manifestVersion, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<Guid> superseded =
            await _inner.SupersedeUnreferencedActiveGoldenManifestsAsync(scope, newManifestId, connection, transaction, cancellationToken);

        foreach (Guid manifestId in superseded)
            await HotPathCacheEviction.RemoveManifestAsync(_hotPathReadCache, scope, manifestId, cancellationToken);

        return superseded;
    }

    private static ScopeContext AmbientScope(ManifestDocument manifest)
    {
        return new ScopeContext { TenantId = manifest.TenantId, WorkspaceId = manifest.WorkspaceId, ProjectId = manifest.ProjectId };
    }
}
