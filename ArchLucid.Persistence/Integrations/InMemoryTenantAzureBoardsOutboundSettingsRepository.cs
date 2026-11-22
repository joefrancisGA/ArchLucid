using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Persistence.Integrations;

/// <summary>In-memory Azure Boards outbound settings for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryTenantAzureBoardsOutboundSettingsRepository : ITenantAzureBoardsOutboundSettingsRepository
{
    private readonly ConcurrentDictionary<Guid, TenantAzureBoardsOutboundSettings> _byTenant = new();

    public Task<TenantAzureBoardsOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return tenantId == Guid.Empty
            ? throw new ArgumentException("tenantId is required.", nameof(tenantId))
            : Task.FromResult(_byTenant.GetValueOrDefault(tenantId));
    }

    public Task<TenantAzureBoardsOutboundSettings> UpsertAsync(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings settings,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(settings);

        TenantAzureBoardsOutboundSettings saved = _byTenant.AddOrUpdate(
            tenantId,
            _ => ApplyDefaults(settings, existing: null),
            (_, existing) => ApplyDefaults(settings, existing));

        return Task.FromResult(saved);
    }

    private static TenantAzureBoardsOutboundSettings ApplyDefaults(
        TenantAzureBoardsOutboundSettings settings,
        TenantAzureBoardsOutboundSettings? existing) => new()
    {
        ProjectName = settings.ProjectName,
        DefaultWorkItemType = settings.DefaultWorkItemType,
        AreaPath = settings.AreaPath,
        IterationPath = settings.IterationPath,
        DefaultTags = settings.DefaultTags,
        LastConnectionTestUtc = existing?.LastConnectionTestUtc,
        LastConnectionTestSummary = existing?.LastConnectionTestSummary,
    };

    public Task UpdateConnectionTestAsync(
        Guid tenantId,
        DateTime testedUtc,
        string summary,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(summary);

        while (_byTenant.TryGetValue(tenantId, out TenantAzureBoardsOutboundSettings? existing))
        {
            TenantAzureBoardsOutboundSettings updated = new()
            {
                ProjectName = existing.ProjectName,
                DefaultWorkItemType = existing.DefaultWorkItemType,
                AreaPath = existing.AreaPath,
                IterationPath = existing.IterationPath,
                DefaultTags = existing.DefaultTags,
                LastConnectionTestUtc = testedUtc,
                LastConnectionTestSummary = summary.Trim(),
            };

            if (_byTenant.TryUpdate(tenantId, updated, existing))
                break;
        }

        return Task.CompletedTask;
    }
}
