using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Weekly sponsor digest email preferences for the caller’s tenant.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantExecDigestPreferencesController(
    IScopeContextProvider scopeProvider,
    ITenantExecDigestPreferencesRepository preferencesRepository,
    IAuditService auditService,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IAuditService
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantExecDigestPreferencesRepository _preferencesRepository =
        preferencesRepository ?? throw new ArgumentNullException(nameof(preferencesRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Reads digest preferences (defaults when no row exists).</summary>
    [HttpGet("exec-digest-preferences")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ExecDigestPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExecDigestPreferences(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        ExecDigestPreferencesResponse? row =
            await _preferencesRepository.GetByTenantAsync(scope.TenantId, cancellationToken);

        return Ok(row ?? ExecDigestPreferencesResponse.Unconfigured(scope.TenantId));
    }

    /// <summary>Upserts digest preferences (Execute+).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("exec-digest-preferences")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ExecDigestPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostExecDigestPreferences(
        [FromBody] ExecDigestPreferencesUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem(
                "Request body is required.",
                ProblemTypes.ValidationFailed);
        }

        int dow = body.DayOfWeek ?? 1;
        int hour = body.HourOfDay ?? 8;

        if (dow is < 0 or > 6)
        {
            return this.BadRequestProblem(
                "dayOfWeek must be between 0 (Sunday) and 6 (Saturday).",
                ProblemTypes.ValidationFailed);
        }

        if (hour is < 0 or > 23)
        {
            return this.BadRequestProblem("hourOfDay must be between 0 and 23.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        string? normalizedTimeZone = IanaTimeZonePreferenceValues.NormalizeOrNull(body.IanaTimeZoneId ?? "UTC");

        if (normalizedTimeZone is null)
        {
            return this.BadRequestProblem(
                "ianaTimeZoneId must be a recognized IANA time zone id.",
                ProblemTypes.ValidationFailed);
        }

        IReadOnlyList<string> recipients = body.RecipientEmails ?? [];

        ExecDigestPreferencesResponse? saved = await _preferencesRepository.UpsertAsync(
            scope.TenantId,
            body.EmailEnabled,
            recipients,
            normalizedTimeZone,
            dow,
            hour,
            cancellationToken);

        if (saved is null)
        {
            return this.NotFoundProblem(
                "Tenant was not found for the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ExecDigestPreferencesUpdated,
                ActorUserId = User.Identity?.Name ?? "operator",
                ActorUserName = User.Identity?.Name ?? "operator",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        emailEnabled = saved.EmailEnabled,
                        recipientCount = saved.RecipientEmails.Count,
                        timeZone = saved.IanaTimeZoneId,
                        dayOfWeek = saved.DayOfWeek,
                        hourOfDay = saved.HourOfDay
                    })
            },
            cancellationToken);

        return Ok(saved);
    }
}
