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

        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        return Task.FromResult(
            _values.GetValueOrDefault((tenantId, normalizedKey)));
    }

    public Task UpsertAsync(Guid tenantId, string settingKey, string settingValue, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(settingValue);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        cancellationToken.ThrowIfCancellationRequested();

        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        _values[(tenantId, normalizedKey)] = settingValue.Trim();

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        cancellationToken.ThrowIfCancellationRequested();

        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        _values.TryRemove((tenantId, normalizedKey), out _);

        return Task.CompletedTask;
    }
}
