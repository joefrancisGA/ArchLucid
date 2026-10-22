namespace ArchLucid.Core.Tenancy;

/// <summary>Pure predicates for <c>dbo.Tenants</c> erasure quarantine + scheduled hard purge.</summary>
public static class TenantErasureEligibility
{
    public static bool IsInErasureQuarantine(TenantRecord? tenant) =>
        tenant?.OffboardedUtc != null;

    /// <summary>Blocks tenant-scoped API access during active or scheduled erasure quarantine.</summary>
    public static bool IsTenantLoginBlocked(TenantRecord? tenant, DateTimeOffset utcNow)
    {
        if (tenant is null)
            return false;

        if (tenant.OffboardedUtc is not null)
            return true;

        if (tenant.TenantErasureRequestedUtc is null)
            return false;

        return tenant.TenantErasureRequestedUtc <= utcNow;
    }

    public static bool IsEligibleForScheduledHardPurge(TenantRecord? tenant, DateTimeOffset utcNow) =>
        tenant is { OffboardedUtc: not null, ErasureEligibleUtc: not null } &&
        tenant.ErasureEligibleUtc <= utcNow &&
        (tenant.LegalHoldUntilUtc is null || tenant.LegalHoldUntilUtc <= utcNow);
}
