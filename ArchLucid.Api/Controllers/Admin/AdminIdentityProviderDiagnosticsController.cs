using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Read-only identity provider health probes for operator diagnostics.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/diagnostics")]
[EnableRateLimiting("fixed")]
public sealed class AdminIdentityProviderDiagnosticsController(
    IOidcWellKnownDiagnosticsService oidcWellKnownDiagnosticsService,
    ISamlOperationalDiagnosticsService samlOperationalDiagnosticsService) : ControllerBase
{
    private readonly IOidcWellKnownDiagnosticsService _oidcWellKnownDiagnosticsService =
        oidcWellKnownDiagnosticsService ?? throw new ArgumentNullException(nameof(oidcWellKnownDiagnosticsService));

    private readonly ISamlOperationalDiagnosticsService _samlOperationalDiagnosticsService =
        samlOperationalDiagnosticsService ?? throw new ArgumentNullException(nameof(samlOperationalDiagnosticsService));

    /// <summary>Returns cached OIDC discovery and SAML SP certificate health probes.</summary>
    [HttpGet("identity-providers")]
    [ProducesResponseType(typeof(AdminIdentityProviderDiagnosticsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminIdentityProviderDiagnosticsResponse>> GetIdentityProviders(
        CancellationToken cancellationToken)
    {
        AdminOidcDiagnosticsResponse oidc =
            await _oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken);

        AdminSamlOperationalHealthResponse saml =
            await _samlOperationalDiagnosticsService.BuildAsync(cancellationToken);

        AdminIdentityProviderDiagnosticsResponse response =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        return Ok(response);
    }
}
