using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryTenantSignInEmailDomainRecoveryAdminRepository
    : ITenantSignInEmailDomainRecoveryAdminRepository
{
    private readonly ConcurrentDictionary<string, TenantSignInEmailDomainRecoveryAdminRecord> _rows =
        new(StringComparer.Ordinal);

    private static string Key(Guid tenantId, string normalizedDomain, string normalizedEmail) =>
        $"{tenantId:D}|{normalizedDomain}|{normalizedEmail}";

    public void Seed(TenantSignInEmailDomainRecoveryAdminRecord record) =>
        _rows[Key(record.TenantId, record.NormalizedDomain, record.NormalizedRecoveryAdminEmail)] = record;

    public Task<IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>> ListByDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> rows = _rows.Values
            .Where(row => row.TenantId == tenantId && row.NormalizedDomain == normalizedDomain)
            .OrderBy(row => row.NormalizedRecoveryAdminEmail, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<bool> IsRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_rows.TryGetValue(Key(tenantId, normalizedDomain, normalizedEmail), out TenantSignInEmailDomainRecoveryAdminRecord? record))
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(record.AuthenticationVerifiedUtc is not null);
    }

    public Task InsertAsync(TenantSignInEmailDomainRecoveryAdminRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _rows[Key(record.TenantId, record.NormalizedDomain, record.NormalizedRecoveryAdminEmail)] = record;

        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _rows.TryRemove(Key(tenantId, normalizedDomain, normalizedRecoveryAdminEmail), out _);

        return Task.CompletedTask;
    }

    public Task MarkAuthenticationVerifiedAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        DateTimeOffset verifiedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string key = Key(tenantId, normalizedDomain, normalizedRecoveryAdminEmail);

        if (!_rows.TryGetValue(key, out TenantSignInEmailDomainRecoveryAdminRecord? existing))
        {
            return Task.CompletedTask;
        }

        _rows[key] = new TenantSignInEmailDomainRecoveryAdminRecord
        {
            TenantId = existing.TenantId,
            NormalizedDomain = existing.NormalizedDomain,
            NormalizedRecoveryAdminEmail = existing.NormalizedRecoveryAdminEmail,
            DisplayRecoveryAdminEmail = existing.DisplayRecoveryAdminEmail,
            CreatedUtc = existing.CreatedUtc,
            CreatedByActorId = existing.CreatedByActorId,
            AuthenticationVerifiedUtc = verifiedUtc
        };

        return Task.CompletedTask;
    }
}
