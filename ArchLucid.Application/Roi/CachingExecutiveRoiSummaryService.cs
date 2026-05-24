using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Decorates <see cref="IExecutiveRoiSummaryService" /> with tenant-scoped hot-path caching for
///     <see cref="IExecutiveRoiSummaryService.BuildAsync" />.
/// </summary>
public sealed class CachingExecutiveRoiSummaryService(
    ExecutiveRoiSummaryService inner,
    IHotPathReadCache cache,
    IScopeContextProvider scopeProvider,
    IOptionsMonitor<ExecutiveRoiCacheWarmupOptions> options) : IExecutiveRoiSummaryService
{
    private readonly ExecutiveRoiSummaryService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IHotPathReadCache _cache =
        cache ?? throw new ArgumentNullException(nameof(cache));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IOptionsMonitor<ExecutiveRoiCacheWarmupOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public async Task<ExecutiveRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ExecutiveRoiCacheWarmupOptions opts = _options.CurrentValue;
        int ttlSeconds = Math.Clamp(opts.CacheTtlSeconds, 60, 86400);

        string cacheKey =
            $"executive-roi:summary:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";

        ExecutiveRoiSummaryResponse? cached = await _cache.GetOrCreateAsync(
            cacheKey,
            async ct => await _inner.BuildAsync(ct).ConfigureAwait(false),
            cancellationToken,
            ttlSeconds).ConfigureAwait(false);

        return cached ?? new ExecutiveRoiSummaryResponse();
    }

    /// <inheritdoc />
    public Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(
        string userDirectoryKey,
        CancellationToken cancellationToken = default)
    {
        return _inner.GetCrossTenantPortfolioSummaryAsync(userDirectoryKey, cancellationToken);
    }

    /// <inheritdoc />
    public Task<ExecutiveRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default)
    {
        return _inner.BuildHistoryAsync(cancellationToken);
    }

    /// <inheritdoc />
    public Task<ExecutiveRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default)
    {
        return _inner.BuildExportAsync(cancellationToken);
    }
}
