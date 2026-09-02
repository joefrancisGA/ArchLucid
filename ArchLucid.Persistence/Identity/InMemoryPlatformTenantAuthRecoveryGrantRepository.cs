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

        PlatformTenantAuthRecoveryGrantRecord stored = PlatformTenantAuthRecoveryGrantRepositoryCore.PrepareInsert(grant);

        _byId[stored.GrantId] = stored;

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
            .Where(row => PlatformTenantAuthRecoveryGrantRepositoryCore.MatchesActiveGrant(row, tenantId, normalizedDomain, nowUtc))
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
            return Task.FromResult(false);

        if (existing.RevokedUtc is not null)
            return Task.FromResult(false);

        _byId[grantId] = PlatformTenantAuthRecoveryGrantRepositoryCore.WithRevoked(
            existing,
            revokedByActorId,
            revokedUtc);

        return Task.FromResult(true);
    }

    public Task MarkTenantNotifiedAsync(Guid grantId, DateTimeOffset notifiedUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(grantId, out PlatformTenantAuthRecoveryGrantRecord? existing))
            return Task.CompletedTask;

        _byId[grantId] = PlatformTenantAuthRecoveryGrantRepositoryCore.WithTenantNotified(existing, notifiedUtc);

        return Task.CompletedTask;
    }
}
