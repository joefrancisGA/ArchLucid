using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryPlatformTenantAuthRecoveryGrantRepository : IPlatformTenantAuthRecoveryGrantRepository
{
    private readonly ConcurrentDictionary<Guid, PlatformTenantAuthRecoveryGrantRecord> _byId = new();

    public Task<PlatformTenantAuthRecoveryGrantRecord> InsertAsync(
        PlatformTenantAuthRecoveryGrantRecord grant,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(grant);

        Guid grantId = grant.GrantId != Guid.Empty ? grant.GrantId : Guid.NewGuid();
        PlatformTenantAuthRecoveryGrantRecord stored = new()
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
            TenantNotifiedUtc = grant.TenantNotifiedUtc
        };

        _byId[grantId] = stored;

        return Task.FromResult(stored);
    }

    public Task<PlatformTenantAuthRecoveryGrantRecord?> GetActiveByTenantAndDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset nowUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        PlatformTenantAuthRecoveryGrantRecord? match = _byId.Values
            .Where(row =>
                row.TenantId == tenantId
                && string.Equals(row.NormalizedDomain, normalizedDomain, StringComparison.Ordinal)
                && row.IsActive(nowUtc))
            .OrderByDescending(row => row.GrantedUtc)
            .FirstOrDefault();

        return Task.FromResult(match);
    }

    public Task<PlatformTenantAuthRecoveryGrantRecord?> GetByIdAsync(Guid grantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId.TryGetValue(grantId, out PlatformTenantAuthRecoveryGrantRecord? row);

        return Task.FromResult(row);
    }

    public Task<bool> RevokeAsync(
        Guid grantId,
        string revokedByActorId,
        DateTimeOffset revokedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(grantId, out PlatformTenantAuthRecoveryGrantRecord? existing))
        {
            return Task.FromResult(false);
        }

        if (existing.RevokedUtc is not null)
        {
            return Task.FromResult(false);
        }

        _byId[grantId] = new PlatformTenantAuthRecoveryGrantRecord
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
            TenantNotifiedUtc = existing.TenantNotifiedUtc
        };

        return Task.FromResult(true);
    }

    public Task MarkTenantNotifiedAsync(Guid grantId, DateTimeOffset notifiedUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(grantId, out PlatformTenantAuthRecoveryGrantRecord? existing))
        {
            return Task.CompletedTask;
        }

        _byId[grantId] = new PlatformTenantAuthRecoveryGrantRecord
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
            TenantNotifiedUtc = notifiedUtc
        };

        return Task.CompletedTask;
    }
}
