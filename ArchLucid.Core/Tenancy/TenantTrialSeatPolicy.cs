namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Determines whether <see cref="ITenantTrialRepository.TryClaimTrialSeatAsync" /> must run for a tenant row.
///     Mirrors the early-exit predicates in <c>DapperTenantRepository.TryClaimTrialSeatAsync</c> before the
///     transactional <c>UPDLOCK</c> read.
/// </summary>
public static class TenantTrialSeatPolicy
{
    /// <summary>
    ///     <c>true</c> when the tenant is on an active self-service trial with a positive seat cap.
    /// </summary>
    public static bool RequiresSeatClaim(TenantRecord? tenant)
    {
        if (tenant is null)
            return false;

        if (!string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return false;

        if (tenant.TrialSeatsLimit is not { } seatLimit || seatLimit < 1)
            return false;

        return true;
    }
}
