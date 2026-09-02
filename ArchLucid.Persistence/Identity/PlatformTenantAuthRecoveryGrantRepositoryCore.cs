using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

/// <summary>
///     Shared platform tenant auth recovery grant mapping and lifecycle transitions for SQL and in-memory stores.
/// </summary>
internal static class PlatformTenantAuthRecoveryGrantRepositoryCore
{
    public static PlatformTenantAuthRecoveryGrantRecord PrepareInsert(PlatformTenantAuthRecoveryGrantRecord grant)
    {
        ArgumentNullException.ThrowIfNull(grant);

        Guid grantId = grant.GrantId != Guid.Empty ? grant.GrantId : Guid.NewGuid();

        return new PlatformTenantAuthRecoveryGrantRecord
        {
            GrantId = grantId,
            TenantId = grant.TenantId,
            NormalizedDomain = grant.NormalizedDomain,
            Reason = grant.Reason,
            EvidenceReference = grant.EvidenceReference,
            GrantedByActorId = grant.GrantedByActorId,
            GrantedUtc = grant.GrantedUtc,
            ExpiresUtc = grant.ExpiresUtc,
            RevokedUtc = grant.RevokedUtc,
            RevokedByActorId = grant.RevokedByActorId,
            TenantNotifiedUtc = grant.TenantNotifiedUtc,
        };
    }

    public static PlatformTenantAuthRecoveryGrantRecord WithRevoked(
        PlatformTenantAuthRecoveryGrantRecord existing,
        string revokedByActorId,
        DateTimeOffset revokedUtc)
    {
        ArgumentNullException.ThrowIfNull(existing);

        return new PlatformTenantAuthRecoveryGrantRecord
        {
            GrantId = existing.GrantId,
            TenantId = existing.TenantId,
            NormalizedDomain = existing.NormalizedDomain,
            Reason = existing.Reason,
            EvidenceReference = existing.EvidenceReference,
            GrantedByActorId = existing.GrantedByActorId,
            GrantedUtc = existing.GrantedUtc,
            ExpiresUtc = existing.ExpiresUtc,
            RevokedUtc = revokedUtc,
            RevokedByActorId = revokedByActorId,
            TenantNotifiedUtc = existing.TenantNotifiedUtc,
        };
    }

    public static PlatformTenantAuthRecoveryGrantRecord WithTenantNotified(
        PlatformTenantAuthRecoveryGrantRecord existing,
        DateTimeOffset notifiedUtc)
    {
        ArgumentNullException.ThrowIfNull(existing);

        return new PlatformTenantAuthRecoveryGrantRecord
        {
            GrantId = existing.GrantId,
            TenantId = existing.TenantId,
            NormalizedDomain = existing.NormalizedDomain,
            Reason = existing.Reason,
            EvidenceReference = existing.EvidenceReference,
            GrantedByActorId = existing.GrantedByActorId,
            GrantedUtc = existing.GrantedUtc,
            ExpiresUtc = existing.ExpiresUtc,
            RevokedUtc = existing.RevokedUtc,
            RevokedByActorId = existing.RevokedByActorId,
            TenantNotifiedUtc = notifiedUtc,
        };
    }

    public static bool MatchesActiveGrant(
        PlatformTenantAuthRecoveryGrantRecord row,
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset nowUtc) =>
        row.TenantId == tenantId
        && string.Equals(row.NormalizedDomain, normalizedDomain, StringComparison.Ordinal)
        && row.IsActive(nowUtc);

    public static PlatformTenantAuthRecoveryGrantRecord MapFromStorage(
        Guid grantId,
        Guid tenantId,
        string normalizedDomain,
        string reason,
        string evidenceReference,
        string grantedByActorId,
        DateTime grantedUtc,
        DateTime expiresUtc,
        DateTime? revokedUtc,
        string? revokedByActorId,
        DateTime? tenantNotifiedUtc) =>
        new()
        {
            GrantId = grantId,
            TenantId = tenantId,
            NormalizedDomain = normalizedDomain,
            Reason = reason,
            EvidenceReference = evidenceReference,
            GrantedByActorId = grantedByActorId,
            GrantedUtc = grantedUtc,
            ExpiresUtc = expiresUtc,
            RevokedUtc = revokedUtc,
            RevokedByActorId = revokedByActorId,
            TenantNotifiedUtc = tenantNotifiedUtc,
        };
}
