using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>Workspace admin allowed engine aliases + default (TB-2110).</summary>
public sealed class WorkspaceAllowedEngineSetService(
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository,
    IAgentModelAliasRegistry aliasRegistry) : IWorkspaceAllowedEngineSetService
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    private readonly IAgentModelAliasRegistry _aliasRegistry =
        aliasRegistry ?? throw new ArgumentNullException(nameof(aliasRegistry));

    public async Task<WorkspaceAllowedEngineSetSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        WorkspaceAllowedEngineSetSnapshot? stored = await TryReadStoredAsync(cancellationToken).ConfigureAwait(false);

        if (stored is not null)
        {
            return stored;
        }

        return BuildCatalogDefaultSnapshot();
    }

    public async Task<WorkspaceAllowedEngineSetSnapshot> SetAsync(
        WorkspaceAllowedEngineSetSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ValidateSnapshot(snapshot);

        Guid tenantId = RequireTenantId();
        string payload = JsonSerializer.Serialize(
            new StoredAllowedEngineSet
            {
                AllowedAliasIds = snapshot.AllowedAliasIds.ToList(),
                DefaultAliasId = snapshot.DefaultAliasId
            },
            SerializerOptions);

        await _tenantSettingsRepository
            .UpsertAsync(tenantId, TenantSettingKeys.WorkspaceAllowedEngineAliases, payload, cancellationToken)
            .ConfigureAwait(false);

        return snapshot;
    }

    public async Task<WorkspaceAllowedEngineSetSnapshot> ClearOverrideAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .DeleteAsync(tenantId, TenantSettingKeys.WorkspaceAllowedEngineAliases, cancellationToken)
            .ConfigureAwait(false);

        return BuildCatalogDefaultSnapshot();
    }

    public bool IsAliasAllowed(WorkspaceAllowedEngineSetSnapshot snapshot, string aliasId)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (string.IsNullOrWhiteSpace(aliasId))
        {
            return false;
        }

        return snapshot.AllowedAliasIds.Any(
            allowed => string.Equals(allowed, aliasId.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private async Task<WorkspaceAllowedEngineSetSnapshot?> TryReadStoredAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.WorkspaceAllowedEngineAliases, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(stored))
        {
            return null;
        }

        StoredAllowedEngineSet? parsed = JsonSerializer.Deserialize<StoredAllowedEngineSet>(stored, SerializerOptions);

        if (parsed is null || parsed.AllowedAliasIds.Count == 0 || string.IsNullOrWhiteSpace(parsed.DefaultAliasId))
        {
            return null;
        }

        WorkspaceAllowedEngineSetSnapshot snapshot = new(
            parsed.AllowedAliasIds,
            parsed.DefaultAliasId.Trim(),
            WorkspaceAllowedEngineSetSource.TenantOverride);

        ValidateSnapshot(snapshot);

        return snapshot;
    }

    private WorkspaceAllowedEngineSetSnapshot BuildCatalogDefaultSnapshot()
    {
        IReadOnlyList<string> allowed = _aliasRegistry
            .ListEntries()
            .Select(entry => entry.AliasId)
            .OrderBy(alias => alias, StringComparer.OrdinalIgnoreCase)
            .ToList();

        string defaultAlias = _aliasRegistry.ResolveAliasIdForTier(LlmModelTier.Standard);

        return new WorkspaceAllowedEngineSetSnapshot(
            allowed,
            defaultAlias,
            WorkspaceAllowedEngineSetSource.CatalogDefault);
    }

    private void ValidateSnapshot(WorkspaceAllowedEngineSetSnapshot snapshot)
    {
        if (snapshot.AllowedAliasIds.Count == 0)
        {
            throw new InvalidOperationException("At least one allowed engine alias is required.");
        }

        if (!_aliasRegistry.TryGet(snapshot.DefaultAliasId, out AgentModelAliasRegistryEntry? defaultEntry)
            || defaultEntry is null)
        {
            throw new InvalidOperationException($"Default alias '{snapshot.DefaultAliasId}' is not registered.");
        }

        if (!IsAliasAllowed(snapshot, snapshot.DefaultAliasId))
        {
            throw new InvalidOperationException("Default alias must be included in the allowed set.");
        }

        foreach (string aliasId in snapshot.AllowedAliasIds)
        {
            if (!_aliasRegistry.TryGet(aliasId, out AgentModelAliasRegistryEntry? entry) || entry is null)
            {
                throw new InvalidOperationException($"Allowed alias '{aliasId}' is not registered.");
            }
        }
    }

    private Guid RequireTenantId()
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
        {
            throw new InvalidOperationException("Tenant scope is required.");
        }

        return tenantId;
    }

    private sealed class StoredAllowedEngineSet
    {
        public List<string> AllowedAliasIds
        {
            get;
            set;
        } = [];

        public string DefaultAliasId
        {
            get;
            set;
        } = string.Empty;
    }
}
