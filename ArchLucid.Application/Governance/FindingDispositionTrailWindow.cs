namespace ArchLucid.Application.Governance;

/// <summary>
///     Shared disposition trail lookback for ROI basis breakdown — aligned with run-detail coverage
///     (<see cref="ArchLucid.Persistence.Queries.DapperAuthorityQueryService" /> two-year window).
/// </summary>
internal static class FindingDispositionTrailWindow
{
    internal static readonly TimeSpan BasisBreakdownLookback = TimeSpan.FromDays(730);
}
