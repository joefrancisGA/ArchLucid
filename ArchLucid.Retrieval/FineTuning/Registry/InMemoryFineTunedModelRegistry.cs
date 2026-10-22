using System.Collections.Concurrent;

using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Registry;

/// <summary>In-memory fine-tuned model registry for Development and tests.</summary>
public sealed class InMemoryFineTunedModelRegistry : IFineTunedModelRegistry
{
    private readonly ConcurrentDictionary<Guid, FineTunedModelRegistryEntry> _activeByTenant = new();

    /// <inheritdoc />
    public Task SaveAsync(FineTunedModelRegistryEntry entry, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(entry);

        if (entry.IsActive)
            _activeByTenant[entry.TenantId] = entry;

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<FineTunedModelRegistryEntry?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _activeByTenant.TryGetValue(tenantId, out FineTunedModelRegistryEntry? entry);

        if (entry is null || entry.RolledBackUtc is not null)
            return Task.FromResult<FineTunedModelRegistryEntry?>(null);

        return Task.FromResult<FineTunedModelRegistryEntry?>(entry);
    }

    /// <inheritdoc />
    public Task RollbackActiveAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (_activeByTenant.TryGetValue(tenantId, out FineTunedModelRegistryEntry? entry))
        {
            entry.RolledBackUtc = TimeProvider.System.UtcNowDateTime();
            entry.IsActive = false;
            _activeByTenant.TryRemove(tenantId, out _);
        }

        return Task.CompletedTask;
    }
}
