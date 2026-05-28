using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

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
    ISamlOperationalDiagnosticsService samlOperationalDiagnosticsService,
    IOptionsMonitor<ArchLucidSamlAuthOptions> samlAuthOptionsMonitor,
    ITenantIdentityProviderConfigurationRepository tenantIdentityProviderConfigurationRepository,
    IScimTenantTokenRepository scimTenantTokenRepository,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private const int MaxAuthDiagnosticsEntries = 200;

    private readonly IAuthDiagnosticsRingBuffer _authDiagnosticsRingBuffer =
        authDiagnosticsRingBuffer ?? throw new ArgumentNullException(nameof(authDiagnosticsRingBuffer));

    private readonly IOidcWellKnownDiagnosticsService _oidcWellKnownDiagnosticsService =
        oidcWellKnownDiagnosticsService ?? throw new ArgumentNullException(nameof(oidcWellKnownDiagnosticsService));

    private readonly ISamlOperationalDiagnosticsService _samlOperationalDiagnosticsService =
        samlOperationalDiagnosticsService ?? throw new ArgumentNullException(nameof(samlOperationalDiagnosticsService));

    private readonly IOptionsMonitor<ArchLucidSamlAuthOptions> _samlAuthOptionsMonitor =
        samlAuthOptionsMonitor ?? throw new ArgumentNullException(nameof(samlAuthOptionsMonitor));

    private readonly ITenantIdentityProviderConfigurationRepository _tenantIdentityProviderConfigurationRepository =
        tenantIdentityProviderConfigurationRepository
        ?? throw new ArgumentNullException(nameof(tenantIdentityProviderConfigurationRepository));

    private readonly IScimTenantTokenRepository _scimTenantTokenRepository =
        scimTenantTokenRepository ?? throw new ArgumentNullException(nameof(scimTenantTokenRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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

    /// <summary>
    ///     Returns host OIDC/SAML configuration checks, optional tenant SSO claim-mapping state, and bounded misconfiguration hints.
    /// </summary>
    [HttpGet("auth/configuration-diagnostics")]
    [ProducesResponseType(typeof(AdminAuthConfigurationDiagnosticsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminAuthConfigurationDiagnosticsResponse>> GetConfigurationDiagnostics(
        CancellationToken cancellationToken)
    {
        AdminOidcDiagnosticsResponse oidc =
            await _oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken).ConfigureAwait(false);

        AdminSamlOperationalHealthResponse saml =
            await _samlOperationalDiagnosticsService.BuildAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        TenantIdentityProviderConfigurationRecord? tenantRow = await _tenantIdentityProviderConfigurationRepository
            .TryGetAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        AuthConfigurationScimDiagnostics? scimDiagnostics =
            await BuildScimDiagnosticsAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            saml,
            _samlAuthOptionsMonitor.CurrentValue,
            tenantRow,
            scimDiagnostics);

        return Ok(response);
    }

    private async Task<AuthConfigurationScimDiagnostics?> BuildScimDiagnosticsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return null;

        IReadOnlyList<ScimTokenSummaryRow> tokens =
            await _scimTenantTokenRepository.ListForTenantAsync(tenantId, cancellationToken).ConfigureAwait(false);

        bool provisioned = tokens.Count > 0;
        bool active = tokens.Any(static row => row.RevokedUtc is null);

        return new AuthConfigurationScimDiagnostics(provisioned, active);
    }
}
