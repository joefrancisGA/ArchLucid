using System.Collections.Concurrent;

using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Notifications.Teams;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class
    InMemoryTenantTeamsIncomingWebhookConnectionRepository : ITenantTeamsIncomingWebhookConnectionRepository
{
    private readonly ConcurrentDictionary<Guid, TeamsIncomingWebhookConnectionResponse> _store = new();

    public Task<TeamsIncomingWebhookConnectionResponse?> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return _store.TryGetValue(tenantId, out TeamsIncomingWebhookConnectionResponse? row)
            ? Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(row)
            : Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(null);
    }

    public Task<TeamsIncomingWebhookConnectionResponse?> UpsertAsync(
        Guid tenantId,
        string keyVaultSecretName,
        string? label,
        IReadOnlyList<string>? enabledTriggers,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<string>? normalizedTriggers = enabledTriggers is null
            ? null
            : TeamsNotificationTriggerCatalog.ParseOrDefault(TeamsNotificationTriggerCatalog.Serialize(enabledTriggers));

        TeamsIncomingWebhookConnectionResponse BuildRow(IReadOnlyList<string> triggers) => new()
        {
            TenantId = tenantId,
            IsConfigured = true,
            Label = label,
            KeyVaultSecretName = keyVaultSecretName,
            EnabledTriggers = triggers,
            UpdatedUtc = TimeProvider.System.GetUtcNow()
        };

        TeamsIncomingWebhookConnectionResponse row = _store.AddOrUpdate(
            tenantId,
            _ => BuildRow(normalizedTriggers ?? TeamsNotificationTriggerCatalog.All),
            (_, existing) => BuildRow(normalizedTriggers ?? existing.EnabledTriggers));

        return Task.FromResult<TeamsIncomingWebhookConnectionResponse?>(row);
    }

    public Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_store.TryRemove(tenantId, out _));
    }
}
