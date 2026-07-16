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

        return Task.FromResult(row);
    }
}
