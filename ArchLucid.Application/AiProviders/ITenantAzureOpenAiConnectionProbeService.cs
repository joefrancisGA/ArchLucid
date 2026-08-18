using ArchLucid.Contracts.Admin;

namespace ArchLucid.Application.AiProviders;

public interface ITenantAzureOpenAiConnectionProbeService
{
    Task<TenantAzureOpenAiConnectionProbeResponse> ProbeAsync(Guid tenantId, CancellationToken cancellationToken);
}
