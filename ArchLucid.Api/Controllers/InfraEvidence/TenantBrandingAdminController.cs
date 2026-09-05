using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/branding/admin")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantBrandingAdminController(
    ITenantBrandingAdminService brandingAdminService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(TenantBrandingAdminStateResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminStateAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        TenantBrandingAdminStateResponse state =
            await brandingAdminService.GetAdminStateAsync(scope, cancellationToken);

        return Ok(state);
    }

    [HttpPut("draft")]
    [ProducesResponseType(typeof(TenantBrandingAdminStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveDraftAsync(
        [FromBody] TenantBrandingDraftPutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        TenantBrandingAdminStateResponse state =
            await brandingAdminService.SaveDraftAsync(scope, body, actor, cancellationToken);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantBrandingProfileChanged,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    brandingProfileId = state.Draft.BrandingProfileId,
                    companyDisplayName = state.Draft.CompanyDisplayName,
                }),
            },
            cancellationToken);

        return Ok(state);
    }

    [HttpPost("activate")]
    [ProducesResponseType(typeof(TenantBrandingActivateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActivateAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        TenantBrandingActivateResponse result =
            await brandingAdminService.ActivateDraftAsync(scope, actor, cancellationToken);

        if (!result.Succeeded)
        {
            return this.BadRequestProblem(
                "Branding draft cannot be activated until validation issues are resolved.",
                ProblemTypes.ValidationFailed,
                extensions: new Dictionary<string, object?>
                {
                    ["validationIssues"] = result.ValidationIssues,
                });
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantBrandingProfileActivated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    brandingProfileId = result.State?.Draft.BrandingProfileId,
                    version = result.State?.Active.Version,
                }),
            },
            cancellationToken);

        return Ok(result);
    }

    [HttpPost("revert")]
    [ProducesResponseType(typeof(TenantBrandingAdminStateResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RevertAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        TenantBrandingAdminStateResponse state =
            await brandingAdminService.RevertToProductDefaultsAsync(scope, actor, cancellationToken);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantBrandingProfileReverted,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
            },
            cancellationToken);

        return Ok(state);
    }
}
