namespace ArchLucid.Core.Tenancy;

/// <summary>Shared rules for paid-tier automation that should not target active self-service trials.</summary>
public static class CommercialTenantEligibility
{
    /// <summary>
    ///     Returns whether the tenant may access HTTP surfaces gated by <paramref name="minimumTier" />.
    ///     Active self-service trials stay on <see cref="TenantTier.Free" /> and must not receive Standard commercial catalogs.
    /// </summary>
    public static bool MeetsCommercialTenantTierGate(TenantRecord tenant, TenantTier minimumTier)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Active)
            && (int)minimumTier >= (int)TenantTier.Standard)
        {
            return false;
        }

        return (int)tenant.Tier >= (int)minimumTier;
    }

    public static bool IsEligibleForWeeklySponsorReport(TenantRecord tenant)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
            return false;

        if ((int)tenant.Tier < (int)TenantTier.Standard)
            return false;

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Active))
            return false;

        return true;
    }
}
