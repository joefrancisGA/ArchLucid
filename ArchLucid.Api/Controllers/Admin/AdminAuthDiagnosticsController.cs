using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Admin endpoint for inspecting recent IdP JWT claim-mapping failures to aid SSO onboarding troubleshooting.
/// </summary>
/// <remarks>
///     Only captures authentication events where the JWT is valid but maps to no known ArchLucid role.
///     No PII, raw token bytes, or secrets are retained — only safe metadata (issuer, audience, role claim values, and
///     absent/unrecognised claim names). Gated by <see cref="ArchLucidPolicies.AdminAuthority" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed class AdminAuthDiagnosticsController(
    IAuthDiagnosticsRingBuffer authDiagnosticsRingBuffer,
    IOidcWellKnownDiagnosticsService oidcWellKnownDiagnosticsService,
    ISamlOperationalDiagnosticsService samlOperationalDiagnosticsService) : ControllerBase
{
    private const int MaxAuthDiagnosticsEntries = 200;

    private readonly IAuthDiagnosticsRingBuffer _authDiagnosticsRingBuffer =
        authDiagnosticsRingBuffer ?? throw new ArgumentNullException(nameof(authDiagnosticsRingBuffer));

    private readonly IOidcWellKnownDiagnosticsService _oidcWellKnownDiagnosticsService =
        oidcWellKnownDiagnosticsService ?? throw new ArgumentNullException(nameof(oidcWellKnownDiagnosticsService));

    private readonly ISamlOperationalDiagnosticsService _samlOperationalDiagnosticsService =
        samlOperationalDiagnosticsService ?? throw new ArgumentNullException(nameof(samlOperationalDiagnosticsService));

    /// <summary>
    ///     Returns the most recent IdP JWT role-mapping failures captured in the in-memory ring buffer.
    /// </summary>
    /// <param name="maxCount">
    ///     Maximum entries to return (1–<see cref="MaxAuthDiagnosticsEntries" />; defaults to 50).
    /// </param>
    [HttpGet("auth-diagnostics")]
    [ProducesResponseType(typeof(IReadOnlyList<AuthDiagnosticEntry>), StatusCodes.Status200OK)]
    public IActionResult GetAuthDiagnostics([FromQuery] int maxCount = 50)
    {
        IReadOnlyList<AuthDiagnosticEntry> entries =
            _authDiagnosticsRingBuffer.GetRecent(Math.Clamp(maxCount, 1, MaxAuthDiagnosticsEntries));

        return Ok(entries);
    }

    /// <summary>
    ///     Returns configured JWT/OIDC authority and audience plus optional OpenID Provider discovery metadata reachability.
    /// </summary>
    [HttpGet("auth/oidc-diagnostics")]
    [ProducesResponseType(typeof(AdminOidcDiagnosticsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminOidcDiagnosticsResponse>> GetOidcDiagnostics(CancellationToken cancellationToken)
    {
        AdminOidcDiagnosticsResponse snapshot =
            await _oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>
    ///     Returns SAML 2.0 SP operational signals (signing certificate expiry and optional IdP metadata
    ///     <c>validUntil</c>).
    /// </summary>
    [HttpGet("auth/saml-operational-health")]
    [ProducesResponseType(typeof(AdminSamlOperationalHealthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminSamlOperationalHealthResponse>> GetSamlOperationalHealth(
        CancellationToken cancellationToken)
    {
        AdminSamlOperationalHealthResponse snapshot =
            await _samlOperationalDiagnosticsService.BuildAsync(cancellationToken);

        return Ok(snapshot);
    }
}
