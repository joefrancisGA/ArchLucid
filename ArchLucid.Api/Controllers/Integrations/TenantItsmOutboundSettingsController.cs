using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Per-tenant ITSM outbound settings (TB-393).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/settings")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantItsmOutboundSettingsController(
    IScopeContextProvider scopeProvider,
    ITenantItsmOutboundSettingsService settingsService,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantItsmOutboundSettingsService _settingsService =
        settingsService ?? throw new ArgumentNullException(nameof(settingsService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Returns tenant ITSM outbound overrides and masked deployment credential posture.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantItsmOutboundSettingsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantItsmOutboundSettingsResponse body =
            await _settingsService.GetAsync(scope, cancellationToken).ConfigureAwait(false);

        return Ok(body);
    }

    /// <summary>Upserts optional per-tenant ITSM outbound overrides for Jira / ServiceNow.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TenantItsmOutboundSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAsync(
        [FromBody] TenantItsmOutboundSettingsUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        if (!TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraProjectKeyOverride(
                body.JiraProjectKeyOverride,
                out _,
                out string? projectError))
        {
            return this.BadRequestProblem(projectError!, ProblemTypes.ValidationFailed);
        }

        if (!TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraIssueTypeBySeverityJson(
                body.JiraIssueTypeBySeverityJson,
                out _,
                out string? jsonError))
        {
            return this.BadRequestProblem(jsonError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantItsmOutboundSettingsResponse saved =
            await _settingsService.UpsertAsync(scope, body, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantItsmOutboundSettingsUpserted,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    hasJiraProjectKeyOverride = !string.IsNullOrWhiteSpace(saved.JiraProjectKeyOverride),
                    saved.JiraSendInfoSeverity,
                    hasIssueTypeMap = !string.IsNullOrWhiteSpace(saved.JiraIssueTypeBySeverityJson),
                    saved.ServiceNowAutoCreateCmdbCi,
                }),
            },
            cancellationToken);

        return Ok(saved);
    }
}
