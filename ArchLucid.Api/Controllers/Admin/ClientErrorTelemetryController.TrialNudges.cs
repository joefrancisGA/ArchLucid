using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Telemetry;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

using ArchLucid.Api.Security;

public sealed partial class ClientErrorTelemetryController
{
    private static readonly HashSet<string> SponsorBannerDayBuckets =
    [
        "0",
        "1-3",
        "4-7",
        "8-30",
        "30+"
    ];

    private static readonly HashSet<string> TrialUpgradeNudgeTriggers =
        new(StringComparer.Ordinal) { "runs", "seats", "expiry" };

    private static readonly HashSet<string> TeamExpansionNudgeTriggers =
        new(StringComparer.Ordinal) { "seats", "workspaces" };

    /// <summary>Records sponsor-banner first-commit badge render (low-cardinality counter).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("sponsor-banner-first-commit-badge")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PostSponsorBannerFirstCommitBadge([FromBody] SponsorBannerFirstCommitBadgeRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.DaysSinceFirstCommitBucket))
            return this.BadRequestProblem(
                "daysSinceFirstCommitBucket is required.",
                ProblemTypes.ValidationFailed);

        string bucket = body.DaysSinceFirstCommitBucket.Trim();

        if (!SponsorBannerDayBuckets.Contains(bucket))
            return this.BadRequestProblem(
                "daysSinceFirstCommitBucket must be one of: 0, 1-3, 4-7, 8-30, 30+.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucidInstrumentation.RecordSponsorBannerFirstCommitBadgeRendered(scope.TenantId, bucket);

        return NoContent();
    }

    /// <summary>Records trial upgrade nudge render (Improvement #14).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("trial-upgrade-nudge/shown")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostTrialUpgradeNudgeShown(
        [FromBody] TrialUpgradeNudgeTelemetryRequest? body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateTrialUpgradeNudgeTrigger(body?.Trigger, out string trigger);

        if (validation is not null)
            return validation;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucidInstrumentation.RecordTrialUpgradeNudgeShown(trigger);
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TrialUpgradeNudgeShown,
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

    /// <summary>Records trial upgrade nudge CTA click (Improvement #14).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("trial-upgrade-nudge/clicked")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostTrialUpgradeNudgeClicked(
        [FromBody] TrialUpgradeNudgeTelemetryRequest? body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateTrialUpgradeNudgeTrigger(body?.Trigger, out string trigger);

        if (validation is not null)
            return validation;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucidInstrumentation.RecordTrialUpgradeNudgeClicked(trigger);
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TrialUpgradeNudgeClicked,
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

    /// <summary>
    ///     Records one first-tenant onboarding funnel event (Improvement 12). Server infers the
    ///     tenant id from request scope; the body carries only the event name. Default emission is
    ///     aggregated-only (no <c>tenant_id</c> tag, no SQL row); per-tenant emission is gated by the
    ///     owner-only flag <c>Telemetry:FirstTenantFunnel:PerTenantEmission</c>.
    /// </summary>
    [HttpPost("first-tenant-funnel")]
    [EnableRateLimiting("registration")]
    [AllowAnonymous]
    [AllowUnscopedRoute]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostFirstTenantFunnelEvent(
        [FromBody] FirstTenantFunnelEventRequest? body,
        CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Event))
            return this.BadRequestProblem(
                "event is required.",
                ProblemTypes.ValidationFailed);

        string eventName = body.Event.Trim();

        if (!FirstTenantFunnelEventNames.IsValid(eventName))
            return this.BadRequestProblem(
                $"event must be one of: {string.Join(", ", FirstTenantFunnelEventNames.All)}.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _firstTenantFunnelEmitter.EmitAsync(eventName, scope.TenantId, ct);

        return NoContent();
    }

    /// <summary>
    ///     Records one Core Pilot first-session checklist step from the operator UI (Improvement QA-2026-05-01). Aggregated
    ///     counter only — safe for anonymous calls with rate limiting.
    /// </summary>
    [HttpPost("core-pilot-rail-step")]
    [EnableRateLimiting("registration")]
    [AllowAnonymous]
    [AllowUnscopedRoute]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PostCorePilotRailChecklistStep([FromBody] CorePilotRailStepRequest? body)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (body.StepIndex is < 0 or > 3)
            return this.BadRequestProblem(
                "stepIndex must be between 0 and 3 inclusive (Core Pilot checklist).",
                ProblemTypes.ValidationFailed);

        ArchLucidInstrumentation.RecordCorePilotRailChecklistStep(body.StepIndex);

        return NoContent();
    }

    private IActionResult? ValidateTrialUpgradeNudgeTrigger(string? rawTrigger, out string trigger)
    {
        trigger = string.Empty;

        if (string.IsNullOrWhiteSpace(rawTrigger))
            return this.BadRequestProblem(
                "trigger is required.",
                ProblemTypes.ValidationFailed);

        trigger = rawTrigger.Trim();

        if (!TrialUpgradeNudgeTriggers.Contains(trigger))
            return this.BadRequestProblem(
                "trigger must be one of: runs, seats, expiry.",
                ProblemTypes.ValidationFailed);

        return null;
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
