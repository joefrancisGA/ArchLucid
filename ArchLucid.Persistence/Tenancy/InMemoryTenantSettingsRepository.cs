using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Tenancy;

public sealed class InMemoryTenantSettingsRepository : ITenantSettingsRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, string Key), string> _values = new();

    public Task<string?> TryGetAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(
            _values.TryGetValue((tenantId, settingKey.Trim()), out string? value) ? value : null);
    }

    public Task UpsertAsync(Guid tenantId, string settingKey, string settingValue, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(settingValue);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        cancellationToken.ThrowIfCancellationRequested();

        _values[(tenantId, settingKey.Trim())] = settingValue.Trim();

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        cancellationToken.ThrowIfCancellationRequested();

        _values.TryRemove((tenantId, settingKey.Trim()), out _);

        return Task.CompletedTask;
    }
}
