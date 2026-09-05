using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
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

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ExecDigestPreferencesResponse? existingPreferences =
            await _preferencesRepository.GetByTenantAsync(scope.TenantId, cancellationToken);

        int dow;
        int hour;
        string? timeZoneInput;

        if (!body.EmailEnabled)
        {
            dow = body.DayOfWeek ?? existingPreferences?.DayOfWeek ?? 1;
            hour = body.HourOfDay ?? existingPreferences?.HourOfDay ?? 8;
            timeZoneInput = body.IanaTimeZoneId ?? existingPreferences?.IanaTimeZoneId ?? "UTC";
        }
        else
        {
            dow = body.DayOfWeek ?? existingPreferences?.DayOfWeek ?? 1;
            hour = body.HourOfDay ?? existingPreferences?.HourOfDay ?? 8;
            timeZoneInput = body.IanaTimeZoneId ?? existingPreferences?.IanaTimeZoneId ?? "UTC";
        }

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

        IReadOnlyList<string>? recipientEmails = body.RecipientEmails;

        if (!body.EmailEnabled && recipientEmails is null or { Count: 0 })
        {
            recipientEmails = existingPreferences?.RecipientEmails;
        }
        else
        {
            recipientEmails ??= existingPreferences?.RecipientEmails;
        }

        string? normalizedTimeZone = IanaTimeZonePreferenceValues.NormalizeOrNull(timeZoneInput);

        if (normalizedTimeZone is null)
        {
            return this.BadRequestProblem(
                "ianaTimeZoneId must be a recognized IANA time zone id.",
                ProblemTypes.ValidationFailed);
        }

        if (!DigestRecipientEmailsValidator.TryNormalize(
                recipientEmails,
                body.EmailEnabled,
                out IReadOnlyList<string> recipients,
                out string? recipientError))
        {
            return this.BadRequestProblem(recipientError!, ProblemTypes.ValidationFailed);
        }

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
