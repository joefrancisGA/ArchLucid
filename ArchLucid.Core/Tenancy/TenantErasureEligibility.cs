namespace ArchLucid.Core.Tenancy;

/// <summary>Pure predicates for <c>dbo.Tenants</c> erasure quarantine + scheduled hard purge.</summary>
public static class TenantErasureEligibility
{
    public static bool IsInErasureQuarantine(TenantRecord? tenant) =>
        tenant is not null && tenant.OffboardedUtc is not null;

    public static bool IsEligibleForScheduledHardPurge(TenantRecord? tenant, DateTimeOffset utcNow) =>
        tenant is not null &&
        tenant.OffboardedUtc is not null &&
        tenant.ErasureEligibleUtc is not null &&
        tenant.ErasureEligibleUtc <= utcNow &&
        (tenant.LegalHoldUntilUtc is null || tenant.LegalHoldUntilUtc <= utcNow);
}
