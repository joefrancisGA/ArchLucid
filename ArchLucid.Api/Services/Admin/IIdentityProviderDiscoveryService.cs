using ArchLucid.Api.Controllers.Admin;

namespace ArchLucid.Api.Services.Admin;

public interface IIdentityProviderDiscoveryService
{
    Task<IdentityProviderDiscoverResponse> DiscoverAsync(
        IdentityProviderDiscoverRequest request,
        CancellationToken cancellationToken);
}
