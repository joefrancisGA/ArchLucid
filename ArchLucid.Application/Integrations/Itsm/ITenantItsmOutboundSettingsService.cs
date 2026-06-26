using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Integrations.Itsm;

public interface ITenantItsmOutboundSettingsService
{
    Task<TenantItsmOutboundSettingsResponse> GetAsync(ScopeContext scope, CancellationToken cancellationToken);

    Task<TenantItsmOutboundSettingsResponse> UpsertAsync(
        ScopeContext scope,
        TenantItsmOutboundSettingsUpsertRequest request,
        CancellationToken cancellationToken);
}
