namespace ArchLucid.Core.Tenancy;

/// <summary>Pure predicates for <c>dbo.Tenants</c> erasure quarantine + scheduled hard purge.</summary>
public static class TenantErasureEligibility
{
    public static bool IsInErasureQuarantine(TenantRecord? tenant) =>
        tenant?.OffboardedUtc != null;

    public static bool IsEligibleForScheduledHardPurge(TenantRecord? tenant, DateTimeOffset utcNow) =>
        tenant is { OffboardedUtc: not null, ErasureEligibleUtc: not null } &&
        tenant.ErasureEligibleUtc <= utcNow &&
        (tenant.LegalHoldUntilUtc is null || tenant.LegalHoldUntilUtc <= utcNow);
}
