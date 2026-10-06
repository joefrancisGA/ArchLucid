using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Admin endpoints for the SSO configuration wizard (discover metadata, sandbox test login, activate tenant row).
/// </summary>
/// <remarks>
///     Persists per-tenant configuration in <c>dbo.TenantIdentityProviderConfigurations</c> only — does not mutate host
///     <c>ArchLucidAuth</c> startup wiring.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/identity")]
public sealed class IdentityProviderConfigurationController(
    IIdentityProviderDiscoveryService discoveryService,
    ISsoWizardTestLoginService testLoginService,
    IIdentityProviderActivationService activationService,
    ITenantIdentityProviderConfigurationRepository configurationRepository,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly IIdentityProviderDiscoveryService _discoveryService =
        discoveryService ?? throw new ArgumentNullException(nameof(discoveryService));

    private readonly ISsoWizardTestLoginService _testLoginService =
        testLoginService ?? throw new ArgumentNullException(nameof(testLoginService));

    private readonly IIdentityProviderActivationService _activationService =
        activationService ?? throw new ArgumentNullException(nameof(activationService));

    private readonly ITenantIdentityProviderConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("discover")]
    [MutatingAuditExcluded("Read-only metadata discovery for SSO wizard; no domain mutation.")]
    [ProducesResponseType(typeof(IdentityProviderDiscoverResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DiscoverAsync(
        [FromBody] IdentityProviderDiscoverRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IdentityProviderDiscoverResponse response =
            await _discoveryService.DiscoverAsync(request, cancellationToken).ConfigureAwait(false);

        return Ok(WithCanonicalWizardUris(response));
    }

    [HttpPost("test-login")]
    [MutatingAuditExcluded("Sandbox JWT preview only; no tenant configuration persisted.")]
    [ProducesResponseType(typeof(IdentityProviderTestLoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult TestLogin([FromBody] IdentityProviderTestLoginRequest request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(request.IssuerUri, out string canonicalIssuerUri))
        {
            return this.BadRequestProblem(
                "IssuerUri must be an absolute HTTP(S) URL.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IdentityProviderTestLoginResponse response = _testLoginService.Execute(
            new IdentityProviderTestLoginRequest
            {
                Protocol = request.Protocol,
                IssuerUri = canonicalIssuerUri,
                ClaimMapping = request.ClaimMapping,
                SampleClaimValues = request.SampleClaimValues,
            },
            scope);

        return Ok(response);
    }

    [HttpPost("activate")]
    [ProducesResponseType(typeof(IdentityProviderActivateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActivateAsync(
        [FromBody] IdentityProviderActivateRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantIdentityProviderConfigurationRecord record;

        try
        {
            record = await _activationService
                .ActivateAsync(scope.TenantId, actorId, request, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        try
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IdentitySsoConfigurationActivated,
                    ActorUserId = record.UpdatedByActorId,
                    ActorUserName = User.Identity?.Name ?? record.UpdatedByActorId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            protocol = record.Protocol switch
                            {
                                TenantIdentityProtocol.Oidc => "oidc",
                                TenantIdentityProtocol.Saml => "saml",
                                _ => record.Protocol.ToString()
                            },
                            issuerUri = record.IssuerUri,
                            keyVaultSecretName = record.KeyVaultSecretName
                        })
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Configuration is already persisted; audit is best-effort for operator forensics.
        }

        return Ok(
            new IdentityProviderActivateResponse
            {
                TenantId = record.TenantId,
                IsActive = record.IsActive,
                UpdatedUtc = record.UpdatedUtc
            });
    }

    [HttpGet("configuration")]
    [ProducesResponseType(typeof(TenantIdentityProviderConfigurationRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConfigurationAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        TenantIdentityProviderConfigurationRecord? record =
            await _configurationRepository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (record is null)
        {
            return this.NotFoundProblem(
                "Identity provider configuration was not found for the current tenant.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(record);
    }

    private static IdentityProviderDiscoverResponse WithCanonicalWizardUris(IdentityProviderDiscoverResponse response)
    {
        if (!response.DiscoverySucceeded)
            return response;

        string? issuerUri = response.IssuerUri;
        if (!string.IsNullOrWhiteSpace(issuerUri)
            && IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(issuerUri, out string canonicalIssuer))
        {
            issuerUri = canonicalIssuer;
        }

        string? jwksUri = response.JwksUri;
        if (!string.IsNullOrWhiteSpace(jwksUri)
            && IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(jwksUri, out string canonicalJwks))
        {
            jwksUri = canonicalJwks;
        }

        if (string.Equals(issuerUri, response.IssuerUri, StringComparison.Ordinal)
            && string.Equals(jwksUri, response.JwksUri, StringComparison.Ordinal))
        {
            return response;
        }

        return new IdentityProviderDiscoverResponse
        {
            Protocol = response.Protocol,
            IssuerUri = issuerUri,
            JwksUri = jwksUri,
            SigningCertificateThumbprints = response.SigningCertificateThumbprints,
            AvailableClaimNames = response.AvailableClaimNames,
            DiscoverySucceeded = response.DiscoverySucceeded,
            DiagnosticSummary = response.DiagnosticSummary,
        };
    }
}
