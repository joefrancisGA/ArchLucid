using ArchLucid.Application.Configuration;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantAgentOutputQualityGateModeService(
    IOptions<AgentOutputQualityGateOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : ITenantAgentOutputQualityGateModeService
{
    private readonly IOptions<AgentOutputQualityGateOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public async Task<TenantAgentOutputQualityGateModeSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        AgentOutputQualityGateMode hostMode = _hostOptions.Value.Mode;
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, cancellationToken)
            .ConfigureAwait(false);

        if (stored is not null && AgentOutputQualityGateOptionsResolver.TryParseMode(stored, out AgentOutputQualityGateMode tenantMode))
        {
            return new TenantAgentOutputQualityGateModeSnapshot(
                tenantMode,
                TenantAgentOutputQualityGateModeSource.TenantOverride,
                hostMode);
        }

        return new TenantAgentOutputQualityGateModeSnapshot(
            hostMode,
            TenantAgentOutputQualityGateModeSource.HostDefault,
            hostMode);
    }

    public async Task<TenantAgentOutputQualityGateModeSnapshot> SetAsync(
        AgentOutputQualityGateMode mode,
        CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.AgentOutputQualityGateMode,
                AgentOutputQualityGateOptionsResolver.FormatMode(mode),
                cancellationToken)
            .ConfigureAwait(false);

        return new TenantAgentOutputQualityGateModeSnapshot(
            mode,
            TenantAgentOutputQualityGateModeSource.TenantOverride,
            _hostOptions.Value.Mode);
    }

    public async Task<TenantAgentOutputQualityGateModeSnapshot> ClearOverrideAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .DeleteAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, cancellationToken)
            .ConfigureAwait(false);

        return await GetAsync(cancellationToken).ConfigureAwait(false);
    }

    private Guid RequireTenantId()
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
            throw new InvalidOperationException("Tenant scope is required.");

        return tenantId;
    }
}
