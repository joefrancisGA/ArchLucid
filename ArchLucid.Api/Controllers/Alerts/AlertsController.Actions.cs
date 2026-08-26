using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Models.Alerts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Alerts;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertsController
{
    /// <summary>Archives an alert in the current scope (hidden from default listings).</summary>
    [HttpPatch("{alertId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(
        Guid alertId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);

        if (existing is null || !MatchesScope(existing, scope))
            return this.NotFoundProblem(
                $"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        if (existing.IsArchived)
            return Ok(existing);

        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        await alertRepository.ArchiveAsync(alertId, ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertArchived,
                RunId = existing.RunId,
                ActorUserId = userId,
                ActorUserName = userName,
                DataJson = JsonSerializer.Serialize(new { alertId }),
            },
            ct);

        AlertRecord? updated = await alertRepository.GetByIdAsync(alertId, ct);

        return Ok(updated ?? existing);
    }

    /// <summary>Alert lifecycle plus redacted delivery attempts for closure visibility.</summary>
    [HttpGet("{alertId:guid}/action-loop")]
    [ProducesResponseType(typeof(AlertActionLoopResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActionLoop(Guid alertId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertActionLoopSnapshot? snapshot =
            await _actionLoopReader.GetAsync(alertId, scope, ct).ConfigureAwait(false);

        if (snapshot is null)
            return this.NotFoundProblem($"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        AlertActionLoopResponse body = new()
        {
            AlertId = snapshot.AlertId,
            Status = snapshot.Status,
            RunId = snapshot.RunId,
            LastUpdatedUtc = snapshot.LastUpdatedUtc,
            ResolutionComment = snapshot.ResolutionComment,
            DeliveryAttempts = snapshot.DeliveryAttempts
                .Select(static a => new AlertDeliveryAttemptResponse
                {
                    ChannelType = a.ChannelType,
                    Status = a.Status,
                    AttemptedUtc = a.AttemptedUtc,
                    DestinationRedacted = a.DestinationRedacted,
                    ErrorMessage = a.ErrorMessage,
                })
                .ToList(),
        };

        return Ok(body);
    }

    /// <summary>Applies an operator action to an alert if it belongs to the current scope.</summary>
    /// <param name="alertId">Target alert id.</param>
    /// <param name="request">Action type and optional comment.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Updated alert, or 404 when missing or out of scope.</returns>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{alertId:guid}/action")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplyAction(
        Guid alertId,
        [FromBody] AlertActionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);
        if (existing is null || !MatchesScope(existing, scope))
            return this.NotFoundProblem(
                $"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        AlertRecord? updated = await alertService.ApplyActionAsync(
            alertId,
            userId,
            userName,
            request,
            ct);

        if (updated is null)
            return this.NotFoundProblem(
                $"Alert '{alertId}' could not be updated.",
                ProblemTypes.ResourceNotFound);

        return Ok(updated);
    }

    /// <summary>Acknowledges many alerts in the current scope; each id is processed independently (partial success).</summary>
    [HttpPost("acknowledge-batch")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertsAcknowledgeBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcknowledgeBatch(
        [FromBody] AlertsAcknowledgeBatchRequest? body,
        CancellationToken ct = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.AlertIds.Count == 0)
            return this.BadRequestProblem("AlertIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (body.AlertIds.Count > 100)
            return this.BadRequestProblem("At most 100 alert ids are allowed per request.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        AlertActionRequest action = new() { Action = AlertActionType.Acknowledge, Comment = body.Comment };

        List<AlertsAcknowledgeBatchItemResult> results = [];
        HashSet<Guid> seen = [];

        foreach (Guid alertId in body.AlertIds)
        {
            if (!seen.Add(alertId))
                continue;

            AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);

            if (existing is null || !MatchesScope(existing, scope))
            {
                results.Add(
                    new AlertsAcknowledgeBatchItemResult
                    {
                        AlertId = alertId, Succeeded = false, Message = "Alert not found in the current scope."
                    });
                continue;
            }

            AlertRecord? updated = await alertService.ApplyActionAsync(alertId, userId, userName, action, ct);

            if (updated is null)
            {
                results.Add(
                    new AlertsAcknowledgeBatchItemResult
                    {
                        AlertId = alertId, Succeeded = false, Message = "Alert could not be acknowledged."
                    });
                continue;
            }

            results.Add(
                new AlertsAcknowledgeBatchItemResult { AlertId = alertId, Succeeded = true });
        }

        return Ok(new AlertsAcknowledgeBatchResponse { Results = results });
    }

    private static bool MatchesScope(AlertRecord alert, ScopeContext scope)
    {
        return alert.TenantId == scope.TenantId &&
               alert.WorkspaceId == scope.WorkspaceId &&
               alert.ProjectId == scope.ProjectId;
    }
}
