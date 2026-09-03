using ArchLucid.Api.Models.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminAuthDiagnosticsController
{
    /// <summary>
    ///     Returns configured JWT/OIDC authority and audience plus optional OpenID Provider discovery metadata reachability.
    /// </summary>
    [HttpGet("auth/oidc-diagnostics")]
    [ProducesResponseType(typeof(AdminOidcDiagnosticsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminOidcDiagnosticsResponse>> GetOidcDiagnostics(CancellationToken cancellationToken)
    {
        AdminOidcDiagnosticsResponse snapshot =
            await oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken);

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
            await samlOperationalDiagnosticsService.BuildAsync(cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>
    ///     Identity providers settings page bundle: probes and configuration diagnostics with a single OIDC/SAML build.
    /// </summary>
    [HttpGet("diagnostics/identity-providers-page-bundle")]
    [ProducesResponseType(typeof(AdminIdentityProvidersPageBundleResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminIdentityProvidersPageBundleResponse>> GetIdentityProvidersPageBundle(
        CancellationToken cancellationToken)
    {
        Task<AdminOidcDiagnosticsResponse> oidcTask =
            oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken);

        Task<AdminSamlOperationalHealthResponse> samlTask =
            samlOperationalDiagnosticsService.BuildAsync(cancellationToken);

        await Task.WhenAll(oidcTask, samlTask).ConfigureAwait(false);

        AdminOidcDiagnosticsResponse oidc = await oidcTask.ConfigureAwait(false);
        AdminSamlOperationalHealthResponse saml = await samlTask.ConfigureAwait(false);

        AdminIdentityProviderDiagnosticsResponse identityProviders =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        AdminAuthConfigurationDiagnosticsResponse authConfiguration =
            await BuildConfigurationDiagnosticsAsync(oidc, saml, cancellationToken).ConfigureAwait(false);

        AdminIdentityProvidersPageBundleResponse body = new()
        {
            IdentityProviderDiagnostics = identityProviders,
            AuthConfigurationDiagnostics = authConfiguration,
            OidcDiagnostics = oidc,
            SamlOperationalHealth = saml,
        };

        return Ok(body);
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
            await oidcWellKnownDiagnosticsService.BuildAsync(cancellationToken).ConfigureAwait(false);

        AdminSamlOperationalHealthResponse saml =
            await samlOperationalDiagnosticsService.BuildAsync(cancellationToken).ConfigureAwait(false);

        AdminAuthConfigurationDiagnosticsResponse response =
            await BuildConfigurationDiagnosticsAsync(oidc, saml, cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }

    private async Task<AdminAuthConfigurationDiagnosticsResponse> BuildConfigurationDiagnosticsAsync(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        TenantIdentityProviderConfigurationRecord? tenantRow = await tenantIdentityProviderConfigurationRepository
            .TryGetAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        AuthConfigurationScimDiagnostics? scimDiagnostics =
            await BuildScimDiagnosticsAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        (bool operatorBaseUrlConfigured, bool localTrialIdentityConfigured) =
            AuthBetaReadinessDiagnosticsEvaluator.Evaluate(
                emailNotificationOptionsMonitor.CurrentValue,
                trialAuthOptionsMonitor.CurrentValue);

        return AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            saml,
            samlAuthOptionsMonitor.CurrentValue,
            tenantRow,
            scimDiagnostics,
            operatorBaseUrlConfigured,
            localTrialIdentityConfigured);
    }

    private async Task<AuthConfigurationScimDiagnostics?> BuildScimDiagnosticsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return null;

        IReadOnlyList<ScimTokenSummaryRow> tokens =
            await scimTenantTokenRepository.ListForTenantAsync(tenantId, cancellationToken).ConfigureAwait(false);

        bool provisioned = tokens.Count > 0;
        bool active = tokens.Any(static row => row.RevokedUtc is null);

        return new AuthConfigurationScimDiagnostics(provisioned, active);
    }
}
