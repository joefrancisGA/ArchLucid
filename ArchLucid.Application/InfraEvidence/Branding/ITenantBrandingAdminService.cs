using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.Branding;

public interface ITenantBrandingAdminService
{
    Task<TenantBrandingAdminStateResponse> GetAdminStateAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<TenantBrandingAdminStateResponse> SaveDraftAsync(
        ScopeContext scope,
        TenantBrandingDraftPutRequest request,
        string actor,
        CancellationToken cancellationToken = default);

    Task<TenantBrandingActivateResponse> ActivateDraftAsync(
        ScopeContext scope,
        string actor,
        CancellationToken cancellationToken = default);

    Task<TenantBrandingAdminStateResponse> RevertToProductDefaultsAsync(
        ScopeContext scope,
        string actor,
        CancellationToken cancellationToken = default);
}
