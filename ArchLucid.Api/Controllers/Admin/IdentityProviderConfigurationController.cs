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
    [ProducesResponseType(typeof(IdentityProviderDiscoverResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IdentityProviderDiscoverResponse>> DiscoverAsync(
        [FromBody] IdentityProviderDiscoverRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IdentityProviderDiscoverResponse response =
            await _discoveryService.DiscoverAsync(request, cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }

    [HttpPost("test-login")]
    [ProducesResponseType(typeof(IdentityProviderTestLoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public ActionResult<IdentityProviderTestLoginResponse> TestLogin([FromBody] IdentityProviderTestLoginRequest request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IdentityProviderTestLoginResponse response = _testLoginService.Execute(request, scope);

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

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.IdentitySsoConfigurationActivated,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        protocol = request.Protocol,
                        issuerUri = record.IssuerUri,
                        keyVaultSecretName = record.KeyVaultSecretName
                    })
            },
            cancellationToken).ConfigureAwait(false);

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
            return NotFound();

        return Ok(record);
    }
}
