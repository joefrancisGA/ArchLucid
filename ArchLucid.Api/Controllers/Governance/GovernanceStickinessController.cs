using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>TB-057–061 stickiness workflow APIs: risk register, dispositions, waivers, decision register.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class GovernanceStickinessController(
    IGovernanceStickinessFacade facade,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IGovernanceStickinessFacade _facade =
        facade ?? throw new ArgumentNullException(nameof(facade));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    [HttpGet("risk-register")]
    [ProducesResponseType(typeof(ArchitectureRiskRegisterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRiskRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        [FromQuery] bool assignedToMe = false,
        CancellationToken cancellationToken = default)
    {
        ArchitectureRiskRegisterResponse response = await _facade.GetRiskRegisterAsync(
            projectId,
            maxRows,
            assignedToMe,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("risk-register/assigned-to-me-count")]
    [ProducesResponseType(typeof(GovernanceAssignedToMeFindingsCountResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignedToMeFindingsCount(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        int count = await _facade.GetAssignedToMeFindingsCountAsync(projectId, cancellationToken);

        return Ok(new GovernanceAssignedToMeFindingsCountResponse { Count = count });
    }

    [HttpGet("reviews-awaiting-action")]
    [ProducesResponseType(typeof(GovernanceReviewsAwaitingActionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetReviewsAwaitingAction(CancellationToken cancellationToken = default)
    {
        GovernanceReviewsAwaitingActionResponse response =
            await _facade.GetReviewsAwaitingActionAsync(cancellationToken);

        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            response,
            ContractJson.CamelCaseIgnoreNullCompact);

        return this.OkWithConditionalEtag(response, etag);
    }

    [HttpGet("decisions-needed-summary")]
    [ProducesResponseType(typeof(GovernanceDecisionsNeededSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetDecisionsNeededSummary(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        GovernanceDecisionsNeededSummaryResponse response =
            await _facade.GetDecisionsNeededSummaryAsync(projectId, cancellationToken);

        string fingerprint = $"decisions-needed|project={projectId ?? scope.ProjectId}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            response,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(response, etag);
    }

    [HttpGet("findings-registers-bundle")]
    [ProducesResponseType(typeof(GovernanceFindingsRegistersBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFindingsRegistersBundle(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        CancellationToken cancellationToken = default)
    {
        GovernanceFindingsRegistersBundleResponse body =
            await _facade.GetFindingsRegistersBundleAsync(projectId, maxRows, cancellationToken);

        return Ok(body);
    }

    [HttpGet("decision-register")]
    [ProducesResponseType(typeof(ArchitectureDecisionRegisterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDecisionRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        [FromQuery] string? category = null,
        [FromQuery] DateTimeOffset? recordedAfterUtc = null,
        [FromQuery] DateTimeOffset? recordedBeforeUtc = null,
        [FromQuery] double? minConfidence = null,
        [FromQuery] double? maxConfidence = null,
        [FromQuery] string? buyerConfidenceSource = null,
        CancellationToken cancellationToken = default)
    {
        ArchitectureDecisionRegisterQueryOptions filters = new()
        {
            Category = category,
            RecordedAfterUtc = recordedAfterUtc,
            RecordedBeforeUtc = recordedBeforeUtc,
            MinConfidence = minConfidence,
            MaxConfidence = maxConfidence,
            BuyerConfidenceSource = buyerConfidenceSource,
        };

        ArchitectureDecisionRegisterResponse response = await _facade.GetDecisionRegisterAsync(
            projectId,
            maxRows,
            filters,
            cancellationToken);

        return Ok(response);
    }

    [IdempotencyFilter]
    [HttpPost("findings/{findingId}/dispositions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(FindingDispositionEventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IFindingReviewTrailAppendService logs FindingReviewDispositionRecorded via IAuditService.")]
    public async Task<IActionResult> RecordDisposition(
        string findingId,
        [FromBody] RecordFindingDispositionRequest? request,
        CancellationToken cancellationToken = default)
    {
        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        RecordFindingDispositionRequest normalized = new()
        {
            FindingId = findingId,
            RunId = request.RunId,
            Disposition = request.Disposition,
            Rationale = request.Rationale,
            RevisitDueUtc = request.RevisitDueUtc,
            EvidenceRequestText = request.EvidenceRequestText,
        };

        try
        {
            FindingDispositionEventDto result =
                await _facade.RecordDispositionAsync(normalized, cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [IdempotencyFilter]
    [HttpPost("findings/bulk-disposition")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecordBulkFindingDispositionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IFindingReviewTrailAppendService logs FindingReviewDispositionRecorded via IAuditService.")]
    public async Task<IActionResult> RecordBulkDisposition(
        [FromBody] RecordBulkFindingDispositionRequest? request,
        CancellationToken cancellationToken = default)
    {
        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.FindingIds is null || request.FindingIds.Count == 0)
            return this.BadRequestProblem("At least one FindingId must be provided.", ProblemTypes.ValidationFailed);

        RecordBulkFindingDispositionResponse response =
            await _facade.RecordBulkDispositionAsync(request, cancellationToken);

        return Ok(response);
    }

    [HttpGet("findings/{findingId}/dispositions")]
    [ProducesResponseType(typeof(IReadOnlyList<FindingDispositionEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDispositions(string findingId, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<FindingDispositionEventDto> history =
            await _facade.ListDispositionsAsync(findingId, cancellationToken);

        return Ok(history);
    }

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
        await _facade.RevokeRiskExceptionAsync(riskExceptionId, cancellationToken);

        return NoContent();
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
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
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

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId:guid}/finding-merge-conflicts/{findingId}/resolve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IGovernanceStickinessFacade.TryResolveFindingMergeConflictAsync logs FindingMergeConflictResolved.")]
    public async Task<IActionResult> ResolveFindingMergeConflict(
        [FromRoute] Guid runId,
        [FromRoute] string findingId,
        [FromBody] ArchLucid.Contracts.Findings.ResolveFindingMergeConflictRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        bool resolved = await _facade.TryResolveFindingMergeConflictAsync(
            runId,
            findingId,
            request,
            cancellationToken).ConfigureAwait(false);

        if (!resolved)
            return this.NotFoundProblem("Finding merge conflict was not found.", ProblemTypes.ResourceNotFound);

        return NoContent();
    }
}
