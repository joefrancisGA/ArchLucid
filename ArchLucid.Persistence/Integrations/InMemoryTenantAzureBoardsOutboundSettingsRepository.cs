using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Persistence.Integrations;

/// <summary>In-memory Azure Boards outbound settings for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryTenantAzureBoardsOutboundSettingsRepository : ITenantAzureBoardsOutboundSettingsRepository
{
    private readonly ConcurrentDictionary<Guid, TenantAzureBoardsOutboundSettings> _byTenant = new();

    public Task<TenantAzureBoardsOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return tenantId == Guid.Empty
            ? throw new ArgumentException("tenantId is required.", nameof(tenantId))
            : Task.FromResult(_byTenant.GetValueOrDefault(tenantId));
    }

    public Task<TenantAzureBoardsOutboundSettings> UpsertAsync(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings settings,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(settings);

        TenantAzureBoardsOutboundSettings merged = new()
        {
            ProjectName = settings.ProjectName,
            DefaultWorkItemType = settings.DefaultWorkItemType,
            AreaPath = settings.AreaPath,
            IterationPath = settings.IterationPath,
            DefaultTags = settings.DefaultTags,
            LastConnectionTestUtc = settings.LastConnectionTestUtc,
            LastConnectionTestSummary = settings.LastConnectionTestSummary,
        };

        _ = _byTenant.AddOrUpdate(tenantId, merged, (_, _) => merged);

        return Task.FromResult(merged);
    }

    public Task UpdateConnectionTestAsync(
        Guid tenantId,
        DateTime testedUtc,
        string summary,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(summary);

        if (_byTenant.TryGetValue(tenantId, out TenantAzureBoardsOutboundSettings? existing))
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

            _byTenant[tenantId] = updated;
        }

        return Task.CompletedTask;
    }
}
