using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryTenantSignInEmailDomainRepository : ITenantSignInEmailDomainRepository
{
    private readonly ConcurrentDictionary<string, TenantSignInEmailDomainRecord> _byDomain =
        new(StringComparer.Ordinal);

    public void Seed(TenantSignInEmailDomainRecord record) => _byDomain[record.NormalizedDomain] = record;

    public Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byDomain.TryGetValue(normalizedDomain, out TenantSignInEmailDomainRecord? row);

        return Task.FromResult(row?.RemovedUtc is null ? row : null);
    }

    public Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<TenantSignInEmailDomainRecord> rows = _byDomain.Values
            .Where(row => row.TenantId == tenantId && row.RemovedUtc is null)
            .OrderBy(row => row.NormalizedDomain, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<TenantSignInEmailDomainRecord?> TryGetAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byDomain.TryGetValue(normalizedDomain, out TenantSignInEmailDomainRecord? row))
        {
            return Task.FromResult<TenantSignInEmailDomainRecord?>(null);
        }

        return Task.FromResult(row.TenantId == tenantId && row.RemovedUtc is null ? row : null);
    }

    public Task InsertAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byDomain.TryAdd(record.NormalizedDomain, record))
        {
            throw new InvalidOperationException($"Domain '{record.NormalizedDomain}' is already registered.");
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byDomain[record.NormalizedDomain] = record;

        return Task.CompletedTask;
    }
}
