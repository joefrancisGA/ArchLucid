using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class AdvisorySchedulingController
{
    /// <summary>
    ///     Creates a schedule with scope ids, normalizes slug, and computes initial
    ///     <see cref="AdvisoryScanSchedule.NextRunUtc" />.
    /// </summary>
    /// <param name="request">
    ///     Client payload; <see cref="AdvisoryScanSchedule.ScheduleId" /> and scope ids are overwritten from
    ///     the authenticated scope.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The persisted schedule including assigned id and computed <see cref="AdvisoryScanSchedule.NextRunUtc" />.</returns>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("schedules")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(typeof(AdvisoryScanSchedule), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateSchedule(
        [FromBody] AdvisoryScanSchedule? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        request.ScheduleId = Guid.NewGuid();
        request.TenantId = scope.TenantId;
        request.WorkspaceId = scope.WorkspaceId;
        request.ProjectId = scope.ProjectId;
        if (string.IsNullOrWhiteSpace(request.RunProjectSlug))
            request.RunProjectSlug = AdvisoryScanSchedule.DefaultProjectSlug;
        request.CreatedUtc = TimeProvider.System.UtcNowDateTime();

        if (!await AdvisoryScheduleEligibilityGuard.HasFinalizedReviewForProjectAsync(
                authorityQueryService,
                scope,
                request.RunProjectSlug,
                ct))
        {
            return this.BadRequestProblem(
                AdvisoryScheduleEligibilityGuard.NoFinalizedReviewMessage,
                ProblemTypes.ValidationFailed);
        }

        if (!scheduleCalculator.IsSupportedCronExpression(request.CronExpression))
        {
            return this.BadRequestProblem(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        DateTime? nextRunUtc = scheduleCalculator.ComputeNextRunUtc(
            request.CronExpression,
            TimeProvider.System.UtcNowDateTime());

        if (nextRunUtc is null)
        {
            return this.BadRequestProblem(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        request.NextRunUtc = nextRunUtc;

        await scheduleRepository.CreateAsync(request, ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdvisoryScanScheduled,
                DataJson = JsonSerializer.Serialize(new { scheduleId = request.ScheduleId, request.Name })
            },
            ct);

        return Ok(request);
    }

    /// <summary>Lists all advisory schedules for the current scope.</summary>
    [HttpGet("schedules")]
    [ProducesResponseType(typeof(IReadOnlyList<AdvisoryScanSchedule>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdvisoryScanSchedule>>> ListSchedules(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<AdvisoryScanSchedule> result = await scheduleRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(result);
    }

    /// <summary>Returns recent execution rows for a schedule in scope.</summary>
    /// <param name="scheduleId">Schedule to load history for.</param>
    /// <param name="take">Maximum rows (newest <see cref="AdvisoryScanExecution.StartedUtc" /> first).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    ///     Execution history, or 404 when the schedule is missing or not in the caller's scope.
    ///     Each <see cref="AdvisoryScanExecution.ResultJson" /> for <c>Completed</c> executions that ran against at least one
    ///     authority run includes
    ///     a <c>traceCompleteness</c> object (per-engine explainability trace population metrics) alongside run and digest
    ///     metadata.
    /// </returns>
    [HttpGet("schedules/{scheduleId:guid}/executions")]
    [ProducesResponseType(typeof(IReadOnlyList<AdvisoryScanExecution>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListExecutions(
        Guid scheduleId,
        [FromQuery] int take = 30,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
        AdvisoryScanSchedule? schedule = await scheduleRepository.GetByIdAsync(scheduleId, ct);
        if (schedule is null)
            return this.NotFoundProblem($"Advisory scan schedule '{scheduleId}' was not found.",
                ProblemTypes.ResourceNotFound);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (!MatchesScope(schedule, scope))
            return this.NotFoundProblem($"Advisory scan schedule '{scheduleId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        IReadOnlyList<AdvisoryScanExecution>
            items = await executionRepository.ListByScheduleAsync(scheduleId, take, ct);
        return Ok(items);
    }

    /// <summary>Runs the advisory pipeline immediately for the schedule (same path as the background worker).</summary>
    /// <param name="scheduleId">Schedule to run.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 when the runner was invoked; 404 when the schedule is unknown or out of scope.</returns>
    /// <remarks>
    ///     Advances <see cref="AdvisoryScanSchedule.LastRunUtc" /> / <see cref="AdvisoryScanSchedule.NextRunUtc" /> like
    ///     a scheduled tick.
    /// </remarks>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("schedules/{scheduleId:guid}/run")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RunNow(Guid scheduleId, CancellationToken ct = default)
    {
        AdvisoryScanSchedule? schedule = await scheduleRepository.GetByIdAsync(scheduleId, ct);
        if (schedule is null)
            return this.NotFoundProblem($"Advisory scan schedule '{scheduleId}' was not found.",
                ProblemTypes.ResourceNotFound);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (!MatchesScope(schedule, scope))
            return this.NotFoundProblem($"Advisory scan schedule '{scheduleId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        if (!await AdvisoryScheduleEligibilityGuard.HasFinalizedReviewForProjectAsync(
                authorityQueryService,
                scope,
                schedule.RunProjectSlug,
                ct))
        {
            return this.BadRequestProblem(
                AdvisoryScheduleEligibilityGuard.NoFinalizedReviewMessage,
                ProblemTypes.ValidationFailed);
        }

        await scanRunner.RunScheduleAsync(schedule, ct);
        return NoContent();
    }
}
