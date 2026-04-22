using System.Collections.Concurrent;

using ArchLucid.Contracts.Integrations;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryTenantTeamsIncomingWebhookConnectionRepository : ITenantTeamsIncomingWebhookConnectionRepository
{
    private readonly ConcurrentDictionary<Guid, TeamsIncomingWebhookConnectionResponse> _store = new();

    public Task<TeamsIncomingWebhookConnectionResponse?> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (_store.TryGetValue(tenantId, out TeamsIncomingWebhookConnectionResponse? row))
            return Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(row);

        return Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(null);
    }

    public Task<TeamsIncomingWebhookConnectionResponse?> UpsertAsync(
        Guid tenantId,
        string keyVaultSecretName,
        string? label,
        CancellationToken cancellationToken)
    {
        TeamsIncomingWebhookConnectionResponse row = new()
        {
            TenantId = tenantId,
            IsConfigured = true,
            Label = label,
            KeyVaultSecretName = keyVaultSecretName,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        _store[tenantId] = row;

        return Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(row);
    }

    public Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken) =>
        Task.FromResult(_store.TryRemove(tenantId, out _));
}
