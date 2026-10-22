using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Tenancy;

public interface ITenantAgentOutputQualityGateModeService
{
    Task<TenantAgentOutputQualityGateModeSnapshot> GetAsync(CancellationToken cancellationToken);

    Task<TenantAgentOutputQualityGateModeSnapshot> SetAsync(AgentOutputQualityGateMode mode, CancellationToken cancellationToken);

    Task<TenantAgentOutputQualityGateModeSnapshot> ClearOverrideAsync(CancellationToken cancellationToken);
}
