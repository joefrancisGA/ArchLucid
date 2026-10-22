using System.Collections.Concurrent;

using ArchLucid.Core.AiProviders;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryTenantAzureOpenAiConnectionRepository : ITenantAzureOpenAiConnectionRepository
{
    private readonly ConcurrentDictionary<Guid, TenantAzureOpenAiConnectionRecord> _store = new();

    public Task<TenantAzureOpenAiConnectionRecord?> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return _store.TryGetValue(tenantId, out TenantAzureOpenAiConnectionRecord? row)
            ? Task.FromResult<TenantAzureOpenAiConnectionRecord?>(row)
            : Task.FromResult<TenantAzureOpenAiConnectionRecord?>(null);
    }

    public Task<TenantAzureOpenAiConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantAzureOpenAiConnectionUpsertCommand command,
        CancellationToken cancellationToken)
    {
        _store.TryGetValue(tenantId, out TenantAzureOpenAiConnectionRecord? existing);

        TenantAzureOpenAiConnectionRecord row = new()
        {
            TenantId = tenantId,
            Endpoint = command.Endpoint,
            AuthMode = command.AuthMode,
            ApiKeyKeyVaultSecretName = command.ApiKeyKeyVaultSecretName,
            DeploymentsJson = command.DeploymentsJson,
            IsEnabled = command.IsEnabled,
            Label = command.Label,
            LastProbeSucceeded = existing?.LastProbeSucceeded,
            LastProbeMessage = existing?.LastProbeMessage,
            LastProbeUtc = existing?.LastProbeUtc,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
        };

        _store[tenantId] = row;

        return Task.FromResult<TenantAzureOpenAiConnectionRecord?>(row);
    }

    public Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return Task.FromResult(_store.TryRemove(tenantId, out _));
    }

    public Task<bool> UpdateProbeResultAsync(
        Guid tenantId,
        bool succeeded,
        string? message,
        CancellationToken cancellationToken)
    {
        if (!_store.TryGetValue(tenantId, out TenantAzureOpenAiConnectionRecord? existing))
        {
            return Task.FromResult(false);
        }

        TenantAzureOpenAiConnectionRecord updated = new()
        {
            TenantId = existing.TenantId,
            Endpoint = existing.Endpoint,
            AuthMode = existing.AuthMode,
            ApiKeyKeyVaultSecretName = existing.ApiKeyKeyVaultSecretName,
            DeploymentsJson = existing.DeploymentsJson,
            IsEnabled = existing.IsEnabled,
            Label = existing.Label,
            LastProbeSucceeded = succeeded,
            LastProbeMessage = message,
            LastProbeUtc = TimeProvider.System.GetUtcNow(),
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
        };

        _store[tenantId] = updated;

        return Task.FromResult(true);
    }
}
