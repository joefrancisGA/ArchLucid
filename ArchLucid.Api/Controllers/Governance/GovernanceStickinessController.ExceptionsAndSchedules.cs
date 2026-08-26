using ArchLucid.Api.ProblemDetails;
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
    [HttpPost("risk-exceptions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RiskExceptionRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionCreated via IAuditService.")]
    public async Task<IActionResult> CreateRiskException(
        [FromBody] CreateRiskExceptionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            RiskExceptionRecord record = await _facade.CreateRiskExceptionAsync(request, cancellationToken);

            return Ok(record);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("risk-exceptions")]
    [ProducesResponseType(typeof(IReadOnlyList<RiskExceptionRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRiskExceptions(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RiskExceptionRecord> records =
            await _facade.ListRiskExceptionsAsync(projectId, cancellationToken);

        return Ok(records);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("risk-exceptions/{riskExceptionId:guid}/revoke")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionRevoked via IAuditService.")]
    public async Task<IActionResult> RevokeRiskException(Guid riskExceptionId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _facade.RevokeRiskExceptionAsync(riskExceptionId, cancellationToken);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("risk-exceptions/{riskExceptionId:guid}/renew")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RiskExceptionRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionRenewed via IAuditService.")]
    public async Task<IActionResult> RenewRiskException(
        Guid riskExceptionId,
        [FromBody] RenewRiskExceptionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            RiskExceptionRecord record =
                await _facade.RenewRiskExceptionAsync(riskExceptionId, request, cancellationToken);

            return Ok(record);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

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
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            ArchitectureReviewRecurrenceSchedule schedule =
                await _facade.CreateRecurrenceScheduleAsync(request, cancellationToken);

            return Ok(schedule);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("recurrence-schedules")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureReviewRecurrenceSchedule>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRecurrenceSchedules(CancellationToken cancellationToken = default)
    {
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
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            return Ok(_facade.PreviewRecurrenceScheduleRuns(request));
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
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        RecurrenceScheduleUpdateResult result =
            await _facade.UpdateRecurrenceScheduleAsync(scheduleId, request, cancellationToken);

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

    [HttpGet("realized-value/attestation")]
    [ProducesResponseType(typeof(RealizedValueAttestationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRealizedValueAttestation(CancellationToken cancellationToken = default)
    {
        RealizedValueAttestationResponse response =
            await _facade.GetRealizedValueAttestationAsync(cancellationToken);

        return Ok(response);
    }

    [HttpPut("realized-value/attestation")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: attestation is stored in TenantSettings; no separate durable audit row in V1.")]
    public async Task<IActionResult> UpsertRealizedValueAttestation(
        [FromBody] UpsertRealizedValueAttestationRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        await _facade.UpsertRealizedValueAttestationAsync(request, cancellationToken);

        return NoContent();
    }
}
