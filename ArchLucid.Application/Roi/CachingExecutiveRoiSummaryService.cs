using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
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
    IRiskExceptionService riskExceptionService,
    IArchitectureRiskRegisterService architectureRiskRegisterService,
    IHotPathReadCache cache,
    IScopeContextProvider scopeProvider,
    IOptionsMonitor<ExecutiveRoiCacheWarmupOptions> options) : IExecutiveRoiSummaryService
{
    private readonly ExecutiveRoiSummaryService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IArchitectureRiskRegisterService _architectureRiskRegisterService =
        architectureRiskRegisterService ?? throw new ArgumentNullException(nameof(architectureRiskRegisterService));

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

        ExecutiveRoiSummaryResponse response = cached ?? new ExecutiveRoiSummaryResponse();

        return await RefreshLiveGovernanceKpisAsync(response, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    ///     TB-155: governance KPI fields are not cached — always aligned with live register and waiver lists.
    /// </summary>
    private async Task<ExecutiveRoiSummaryResponse> RefreshLiveGovernanceKpisAsync(
        ExecutiveRoiSummaryResponse response,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IReadOnlyList<RiskExceptionRecord> activeWaivers = await _riskExceptionService
            .ListActiveAsync(scope.TenantId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        response.ExpiringWaiversCount14Days = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(
            activeWaivers,
            TimeProvider.System.UtcNowDateTime(),
            GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays);

        ArchitectureRiskRegisterResponse register = await _architectureRiskRegisterService
            .GetRegisterAsync(scope.TenantId, scope.ProjectId, maxRows: 100, cancellationToken)
            .ConfigureAwait(false);

        response.StaleArchitectureRiskCount = StaleArchitectureRiskCountCalculator.CountStale(register);

        return response;
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
