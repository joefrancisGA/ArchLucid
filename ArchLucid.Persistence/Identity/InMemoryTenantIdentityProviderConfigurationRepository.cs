using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "In-memory store for dev/test hosts.")]
public sealed class InMemoryTenantIdentityProviderConfigurationRepository
    : ITenantIdentityProviderConfigurationRepository
{
    private readonly ConcurrentDictionary<Guid, TenantIdentityProviderConfigurationRecord> _rows = new();

    public Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _rows.TryGetValue(tenantId, out TenantIdentityProviderConfigurationRecord? row);

        return Task.FromResult(row);
    }

    public Task UpsertAsync(TenantIdentityProviderConfigurationRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _rows[record.TenantId] = record;

        return Task.CompletedTask;
    }
}
