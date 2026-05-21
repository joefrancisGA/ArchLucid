namespace ArchLucid.Core.Tenancy;

/// <summary>Shared rules for paid-tier automation that should not target active self-service trials.</summary>
public static class CommercialTenantEligibility
{
    public static bool IsEligibleForWeeklyExecutiveSummary(TenantRecord tenant)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
            return false;

        if ((int)tenant.Tier < (int)TenantTier.Standard)
            return false;

        if (string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return false;

        return true;
    }
}
