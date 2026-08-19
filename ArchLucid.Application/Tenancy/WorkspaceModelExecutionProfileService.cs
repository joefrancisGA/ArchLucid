using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class WorkspaceModelExecutionProfileService(
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : IWorkspaceModelExecutionProfileService
{
    public static AgentModelExecutionProfile WorkspaceDefaultProfile => AgentModelExecutionProfile.Balanced;

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public async Task<WorkspaceModelExecutionProfileSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.DefaultModelExecutionProfile, cancellationToken)
            .ConfigureAwait(false);

        if (stored is not null
            && AgentModelExecutionProfileParser.TryParse(stored, out AgentModelExecutionProfile tenantProfile))
        {
            return new WorkspaceModelExecutionProfileSnapshot(
                tenantProfile,
                WorkspaceModelExecutionProfileSource.TenantOverride);
        }

        return new WorkspaceModelExecutionProfileSnapshot(
            WorkspaceDefaultProfile,
            WorkspaceModelExecutionProfileSource.WorkspaceDefault);
    }

    public async Task<WorkspaceModelExecutionProfileSnapshot> SetAsync(
        AgentModelExecutionProfile profile,
        CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.DefaultModelExecutionProfile,
                AgentModelExecutionProfileParser.Format(profile),
                cancellationToken)
            .ConfigureAwait(false);

        return new WorkspaceModelExecutionProfileSnapshot(
            profile,
            WorkspaceModelExecutionProfileSource.TenantOverride);
    }

    public async Task<WorkspaceModelExecutionProfileSnapshot> ClearOverrideAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .DeleteAsync(tenantId, TenantSettingKeys.DefaultModelExecutionProfile, cancellationToken)
            .ConfigureAwait(false);

        return await GetAsync(cancellationToken).ConfigureAwait(false);
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
}
