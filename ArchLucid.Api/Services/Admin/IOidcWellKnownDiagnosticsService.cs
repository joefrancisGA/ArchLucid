using ArchLucid.Api.Controllers.Admin;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Builds <see cref="AdminOidcDiagnosticsResponse" /> by reading auth options and optionally fetching OIDC discovery.
/// </summary>
public interface IOidcWellKnownDiagnosticsService
{
    /// <summary>
    ///     Loads configured authority/audience (and related flags), then attempts discovery when JWT bearer uses OIDC metadata.
    /// </summary>
    Task<AdminOidcDiagnosticsResponse> BuildAsync(CancellationToken cancellationToken);
}
