using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Cached trailing-30-day pilot aggregates for operator home (same RLS scope as
///     <see cref = "PilotScorecardBuilder"/>).
/// </summary>
public sealed class PilotOutcomeSummaryService
{
    private readonly IMemoryCache _memoryCache;
    private readonly PilotScorecardBuilder _pilotScorecardBuilder;
    private readonly IScopeContextProvider _scopeContextProvider;

    public PilotOutcomeSummaryService(
        PilotScorecardBuilder pilotScorecardBuilder,
        IMemoryCache memoryCache,
        IScopeContextProvider scopeContextProvider)
    {
        ArgumentNullException.ThrowIfNull(pilotScorecardBuilder);
        ArgumentNullException.ThrowIfNull(memoryCache);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);

        _pilotScorecardBuilder = pilotScorecardBuilder;
        _memoryCache = memoryCache;
        _scopeContextProvider = scopeContextProvider;
    }

    /// <summary>Trailing 30 days in UTC, ending at <c>UtcNow</c> (exclusive end semantics match scorecard builder).</summary>
    public async Task<PilotScorecardSummary> GetTrailing30DaysAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string cacheKey = $"pilot-outcome-summary:30d:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
        if (_memoryCache.TryGetValue(cacheKey, out PilotScorecardSummary? cached) && cached is not null)
            return cached;
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        PilotScorecardSummary summary = await _pilotScorecardBuilder.BuildAsync(start, end, cancellationToken);
        _memoryCache.Set(cacheKey, summary, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60) });
        return summary;
    }
}
