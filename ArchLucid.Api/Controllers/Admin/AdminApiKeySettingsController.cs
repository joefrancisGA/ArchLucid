using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Host API key status and rotation material issuance (<see cref="ArchLucidPolicies.AdminAuthority" />).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/settings/api-keys")]
public sealed class AdminApiKeySettingsController(
    IAdminApiKeySettingsService apiKeySettingsService,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IAdminApiKeySettingsService _apiKeySettingsService =
        apiKeySettingsService ?? throw new ArgumentNullException(nameof(apiKeySettingsService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet]
    [ProducesResponseType(typeof(AdminApiKeySettingsResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminApiKeySettingsResponse> Get() => Ok(_apiKeySettingsService.GetSnapshot());

    [HttpPost("rotate")]
    [ProducesResponseType(typeof(AdminApiKeyRotateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RotateAsync(
        [FromBody] AdminApiKeyRotateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        AdminApiKeyRotateResponse response;

        try
        {
            response = _apiKeySettingsService.Rotate(request);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdminApiKeyRotationMaterialIssued,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        slot = response.Slot,
                        deploymentAction = response.DeploymentAction,
                        configPath = response.ConfigPath
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }
}
