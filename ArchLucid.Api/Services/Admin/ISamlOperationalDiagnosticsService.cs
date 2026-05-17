using ArchLucid.Api.Controllers.Admin;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Builds operator SAML SP operational signals without affecting authentication behaviour.</summary>
public interface ISamlOperationalDiagnosticsService
{
    Task<AdminSamlOperationalHealthResponse> BuildAsync(CancellationToken cancellationToken);
}
