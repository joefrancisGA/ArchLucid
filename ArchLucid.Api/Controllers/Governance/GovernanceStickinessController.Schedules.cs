using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("recurrence-schedules")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureReviewRecurrenceSchedule), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IGovernanceStickinessFacade.CreateRecurrenceScheduleAsync logs ArchitectureReviewRecurrenceScheduleCreated.")]
    public async Task<IActionResult> CreateRecurrenceSchedule(
        [FromBody] CreateArchitectureReviewRecurrenceScheduleRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? scheduleValidation =
            GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule(
                    request!,
                    _recurrenceNextRunCalculator.IsSupportedCronExpression)
                .ToBadRequestProblemOrNull(this);

        if (scheduleValidation is not null)
            return scheduleValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            ArchitectureReviewRecurrenceSchedule schedule =
                await _facade.CreateRecurrenceScheduleAsync(request!, cancellationToken);

            return Ok(schedule);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("recurrence-schedules")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureReviewRecurrenceSchedule>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListRecurrenceSchedules(CancellationToken cancellationToken = default)
    {
        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> schedules =
            await _facade.ListRecurrenceSchedulesAsync(cancellationToken);

        return Ok(schedules);
    }

    // idempotency-posture: dry-run-no-persist
    [HttpPost("recurrence-schedules/preview-next-runs")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Read-only recurrence schedule preview; no schedule persisted.")]
    [ProducesResponseType(typeof(PreviewRecurrenceScheduleRunsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PreviewRecurrenceScheduleRuns([FromBody] PreviewRecurrenceScheduleRunsRequest? request)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        try
        {
            return Ok(_facade.PreviewRecurrenceScheduleRuns(request!));
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpPut("recurrence-schedules/{scheduleId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureReviewRecurrenceSchedule), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IGovernanceStickinessFacade.UpdateRecurrenceScheduleAsync logs ArchitectureReviewRecurrenceScheduleUpdated.")]
    public async Task<IActionResult> UpdateRecurrenceSchedule(
        Guid scheduleId,
        [FromBody] UpdateArchitectureReviewRecurrenceScheduleRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? scheduleValidation =
            GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule(
                    request!,
                    _recurrenceNextRunCalculator.IsSupportedCronExpression)
                .ToBadRequestProblemOrNull(this);

        if (scheduleValidation is not null)
            return scheduleValidation;

        IActionResult? scheduleIdProblem =
            GovernanceStickinessControllerCore.ValidateScheduleId(scheduleId).ToBadRequestProblemOrNull(this);

        if (scheduleIdProblem is not null)
            return scheduleIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            RecurrenceScheduleUpdateResult result =
                await _facade.UpdateRecurrenceScheduleAsync(scheduleId, request!, cancellationToken);

            return result.Outcome switch
            {
                RecurrenceScheduleUpdateOutcome.NotFound => this.NotFoundProblem(
                    "Recurrence schedule was not found.",
                    ProblemTypes.ResourceNotFound),
                RecurrenceScheduleUpdateOutcome.InvalidCron => this.BadRequestProblem(
                    Application.Governance.RecurrenceScheduleCronValidation.InvalidCronMessage,
                    ProblemTypes.ValidationFailed),
                RecurrenceScheduleUpdateOutcome.Updated => Ok(result.Schedule),
                _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
            };
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
