using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Telemetry;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

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
}
