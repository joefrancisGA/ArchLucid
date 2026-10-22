using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Admin;

using ArchLucid.Core.Authorization;

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
public sealed partial class AdminAuthDiagnosticsController(
    IAuthDiagnosticsRingBuffer authDiagnosticsRingBuffer,
    IOidcWellKnownDiagnosticsService oidcWellKnownDiagnosticsService,
    ISamlOperationalDiagnosticsService samlOperationalDiagnosticsService,
    IOptionsMonitor<ArchLucidSamlAuthOptions> samlAuthOptionsMonitor,
    IOptionsMonitor<EmailNotificationOptions> emailNotificationOptionsMonitor,
    IOptionsMonitor<TrialAuthOptions> trialAuthOptionsMonitor,
    ITenantIdentityProviderConfigurationRepository tenantIdentityProviderConfigurationRepository,
    IScimTenantTokenRepository scimTenantTokenRepository,
    IScopeContextProvider scopeContextProvider,
    ITokenClaimsDiagnosticService tokenClaimsDiagnosticService,
    IAuditService auditService) : ControllerBase;
