using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using System.Text.Json;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>TB-057–061 stickiness workflow APIs: risk register, dispositions, waivers, decision register.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class GovernanceStickinessController(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IFindingDispositionService findingDispositionService,
    IRiskExceptionService riskExceptionService,
    IArchitectureRiskRegisterService riskRegisterService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IArchitectureReviewRecurrenceScheduleRepository recurrenceScheduleRepository,
    IArchitectureReviewRecurrenceNextRunCalculator recurrenceNextRunCalculator,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    [HttpGet("risk-register")]
    [ProducesResponseType(typeof(ArchitectureRiskRegisterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRiskRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureRiskRegisterResponse response = await riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            Math.Clamp(maxRows, 1, 500),
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("decisions-needed-summary")]
    [ProducesResponseType(typeof(GovernanceDecisionsNeededSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDecisionsNeededSummary(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        GovernanceDecisionsNeededSummaryResponse response = await governanceDigestDecisionNeededComposer.BuildSummaryAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            cancellationToken);

        return Ok(response);
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
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureDecisionRegisterQueryOptions filters = new()
        {
            Category = category,
            RecordedAfterUtc = recordedAfterUtc,
            RecordedBeforeUtc = recordedBeforeUtc,
            MinConfidence = minConfidence,
            MaxConfidence = maxConfidence,
            BuyerConfidenceSource = buyerConfidenceSource,
        };

        ArchitectureDecisionRegisterResponse response = await decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            Math.Clamp(maxRows, 1, 500),
            filters,
            cancellationToken);

        return Ok(response);
    }

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
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            FindingDispositionEventDto result = await findingDispositionService.RecordAsync(
                normalized,
                scope,
                actorContext.GetActorId(),
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("findings/{findingId}/dispositions")]
    [ProducesResponseType(typeof(IReadOnlyList<FindingDispositionEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDispositions(string findingId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<FindingDispositionEventDto> history = await findingDispositionService.ListHistoryAsync(
            scope.TenantId,
            findingId,
            cancellationToken);

        return Ok(history);
    }

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
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RiskExceptionRecord record = await riskExceptionService.CreateAsync(
                request,
                scope,
                actorContext.GetActorId(),
                cancellationToken);

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
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<RiskExceptionRecord> records = await riskExceptionService.ListActiveAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            cancellationToken);

        return Ok(records);
    }

    [HttpPost("risk-exceptions/{riskExceptionId:guid}/revoke")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionRevoked via IAuditService.")]
    public async Task<IActionResult> RevokeRiskException(Guid riskExceptionId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await riskExceptionService.RevokeAsync(scope.TenantId, riskExceptionId, actorContext.GetActorId(), cancellationToken);

        return NoContent();
    }

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
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RiskExceptionRecord record = await riskExceptionService.RenewAsync(
                scope.TenantId,
                riskExceptionId,
                request,
                actorContext.GetActorId(),
                cancellationToken);

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

    [HttpPost("recurrence-schedules")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureReviewRecurrenceSchedule), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRecurrenceSchedule(
        [FromBody] CreateArchitectureReviewRecurrenceScheduleRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.SourceRunId == Guid.Empty)
            return this.BadRequestProblem("Source run id is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime now = TimeProvider.System.UtcNowDateTime();
        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SourceRunId = request.SourceRunId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Recurring architecture review" : request.Name.Trim(),
            CronExpression = string.IsNullOrWhiteSpace(request.CronExpression) ? "0 8 * * 1" : request.CronExpression.Trim(),
            IsEnabled = request.IsEnabled,
            CreatedUtc = now,
            CreatedByUserId = actorContext.GetActorId(),
            NextRunUtc = recurrenceNextRunCalculator.ComputeNextRunUtc(
                string.IsNullOrWhiteSpace(request.CronExpression) ? "0 8 * * 1" : request.CronExpression.Trim(),
                now),
        };

        await recurrenceScheduleRepository.CreateAsync(schedule, cancellationToken);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureReviewRecurrenceScheduleCreated,
                DataJson = JsonSerializer.Serialize(new
                {
                    schedule.ScheduleId,
                    schedule.TenantId,
                    schedule.WorkspaceId,
                    schedule.ProjectId,
                    schedule.SourceRunId,
                    schedule.CronExpression,
                    schedule.IsEnabled,
                }),
            },
            cancellationToken);

        return Ok(schedule);
    }

    [HttpGet("recurrence-schedules")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureReviewRecurrenceSchedule>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRecurrenceSchedules(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> schedules =
            await recurrenceScheduleRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        return Ok(schedules);
    }

    [HttpGet("realized-value/attestation")]
    [ProducesResponseType(typeof(RealizedValueAttestationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRealizedValueAttestation(
        [FromServices] IRealizedValueAttestationService attestationService,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RealizedValueAttestationResponse response =
            await attestationService.GetAttestationAsync(scope.TenantId, cancellationToken);

        return Ok(response);
    }

    [HttpPut("realized-value/attestation")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: attestation is stored in TenantSettings; no separate durable audit row in V1.")]
    public async Task<IActionResult> UpsertRealizedValueAttestation(
        [FromBody] UpsertRealizedValueAttestationRequest? request,
        [FromServices] IRealizedValueAttestationService attestationService,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await attestationService.SaveAttestationAsync(scope.TenantId, request, cancellationToken);

        return NoContent();
    }
}
