namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Internal-only aggregate counters across tenants (<see cref="IAdminDiagnosticsService.GetCrossTenantUsageRollupAsync" />).
/// </summary>
/// <remarks>
///     Population paths must remain aggregate-only (no customer-identifying breakdown); callers require
///     <c>AdminAuthority</c>.
/// </remarks>
public sealed record CrossTenantUsageRollup(
    long DistinctTenantCount,
    long CommittedRunsCount,
    long TotalRunsCount,
    DateTimeOffset GeneratedUtc);
