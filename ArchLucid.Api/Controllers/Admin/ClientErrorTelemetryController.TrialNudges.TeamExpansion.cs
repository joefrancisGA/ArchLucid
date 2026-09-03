using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class ClientErrorTelemetryController
{
    private static readonly HashSet<string> TeamExpansionNudgeTriggers =
        new(StringComparer.Ordinal) { "seats", "workspaces" };

    /// <summary>Records paid Team expansion nudge render (Improvement #5).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("team-expansion-nudge/shown")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostTeamExpansionNudgeShown(
        [FromBody] TeamExpansionNudgeTelemetryRequest? body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateTeamExpansionNudgeTrigger(body?.Trigger, out string trigger);

        if (validation is not null)
            return validation;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucidInstrumentation.RecordTeamExpansionNudgeShown(trigger);
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TeamExpansionNudgeShown,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { trigger })
            },
            ct);

        return NoContent();
    }

    /// <summary>Records paid Team expansion nudge CTA click (Improvement #5).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("team-expansion-nudge/clicked")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostTeamExpansionNudgeClicked(
        [FromBody] TeamExpansionNudgeTelemetryRequest? body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateTeamExpansionNudgeTrigger(body?.Trigger, out string trigger);

        if (validation is not null)
            return validation;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucidInstrumentation.RecordTeamExpansionNudgeClicked(trigger);
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TeamExpansionNudgeClicked,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { trigger })
            },
            ct);

        return NoContent();
    }

    private IActionResult? ValidateTeamExpansionNudgeTrigger(string? rawTrigger, out string trigger)
    {
        trigger = string.Empty;

        if (string.IsNullOrWhiteSpace(rawTrigger))
            return this.BadRequestProblem(
                "trigger is required.",
                ProblemTypes.ValidationFailed);

        trigger = rawTrigger.Trim();

        if (!TeamExpansionNudgeTriggers.Contains(trigger))
            return this.BadRequestProblem(
                "trigger must be one of: seats, workspaces.",
                ProblemTypes.ValidationFailed);

        return null;
    }
}
