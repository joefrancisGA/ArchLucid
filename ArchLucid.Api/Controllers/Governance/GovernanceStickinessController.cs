using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Http;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
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
    ArchLucid.Persistence.Interfaces.IRunRepository runRepository,
    ArchLucid.Application.Findings.IFindingMergeConflictResolutionService findingMergeConflictResolutionService,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    IReviewsAwaitingActionQueryService reviewsAwaitingActionQueryService,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ArchLucid.Persistence.Interfaces.IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ArchLucid.Application.Findings.IFindingMergeConflictResolutionService _findingMergeConflictResolutionService =
        findingMergeConflictResolutionService ?? throw new ArgumentNullException(nameof(findingMergeConflictResolutionService));

    [HttpGet("risk-register")]
    [ProducesResponseType(typeof(ArchitectureRiskRegisterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRiskRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        [FromQuery] bool assignedToMe = false,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureRiskRegisterListOptions? options = null;

        if (assignedToMe)
        {
            IReadOnlyList<string> identities = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actorContext);

            if (identities.Count == 0)
            {
                return Ok(new ArchitectureRiskRegisterResponse { Entries = [] });
            }

            options = new ArchitectureRiskRegisterListOptions
            {
                AssignedToUserIds = identities,
                OpenFindingsOnly = true,
            };
        }

        ArchitectureRiskRegisterResponse response = await riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            Math.Clamp(maxRows, 1, 500),
            options,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("risk-register/assigned-to-me-count")]
    [ProducesResponseType(typeof(GovernanceAssignedToMeFindingsCountResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignedToMeFindingsCount(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<string> identities = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actorContext);

        if (identities.Count == 0)
        {
            return Ok(new GovernanceAssignedToMeFindingsCountResponse { Count = 0 });
        }

        ArchitectureRiskRegisterListOptions options = new()
        {
            AssignedToUserIds = identities,
            OpenFindingsOnly = true,
        };

        int count = await riskRegisterService.CountAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            options,
            cancellationToken);

        return Ok(new GovernanceAssignedToMeFindingsCountResponse { Count = count });
    }

    [HttpGet("reviews-awaiting-action")]
    [ProducesResponseType(typeof(GovernanceReviewsAwaitingActionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetReviewsAwaitingAction(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        GovernanceReviewsAwaitingActionResponse response =
            await reviewsAwaitingActionQueryService.ListAsync(scope, cancellationToken);

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
        GovernanceDecisionsNeededSummaryResponse response = await governanceDigestDecisionNeededComposer.BuildSummaryAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            cancellationToken);

        string fingerprint = $"decisions-needed|project={projectId ?? scope.ProjectId}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            response,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(response, etag);
    }

    /// <summary>Risk and decision registers for the governance findings queue (default list filters).</summary>
    [HttpGet("findings-registers-bundle")]
    [ProducesResponseType(typeof(GovernanceFindingsRegistersBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFindingsRegistersBundle(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        int take = Math.Clamp(maxRows, 1, 500);
        Guid resolvedProjectId = projectId ?? scope.ProjectId;

        Task<ArchitectureRiskRegisterResponse> riskTask = riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            options: null,
            cancellationToken);

        Task<ArchitectureDecisionRegisterResponse> decisionTask = decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            filters: new ArchitectureDecisionRegisterQueryOptions(),
            cancellationToken);

        await Task.WhenAll(riskTask, decisionTask).ConfigureAwait(false);

        GovernanceFindingsRegistersBundleResponse body = new()
        {
            RiskRegister = await riskTask.ConfigureAwait(false),
            DecisionRegister = await decisionTask.ConfigureAwait(false)
        };

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

    // idempotency-posture: explicit-idempotency-key
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

    // idempotency-posture: explicit-idempotency-key
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

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();
        
        var updated = new List<string>();

        foreach (string findingId in request.FindingIds)
        {
            RecordFindingDispositionRequest normalized = new()
            {
                FindingId = findingId,
                RunId = Guid.Empty,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                RevisitDueUtc = request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Deferred && request.RevisitDueUtc is null 
                    ? TimeProvider.System.GetUtcNow().AddDays(30) 
                    : request.RevisitDueUtc
            };

            try
            {
                await findingDispositionService.RecordAsync(
                    normalized,
                    scope,
                    actorId,
                    cancellationToken);
                updated.Add(findingId);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
            }
        }

        return Ok(new RecordBulkFindingDispositionResponse 
        { 
            ProcessedCount = updated.Count, 
            UpdatedFindingIds = updated 
        });
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

    // idempotency-posture: operator-documented-safe-retry
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

    // idempotency-posture: operator-documented-safe-retry
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

        if (!request.IsEnabled.HasValue)
        {
            return this.BadRequestProblem(
                "isEnabled is required. Set true to activate recurring assessments or false to save paused.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime now = TimeProvider.System.UtcNowDateTime();
        string cronExpression = string.IsNullOrWhiteSpace(request.CronExpression) ? "0 8 * * 1" : request.CronExpression.Trim();

        ArchLucid.Persistence.Models.RunRecord? sourceRun = await _runRepository
            .GetByIdAsync(scope, request.SourceRunId, cancellationToken)
            .ConfigureAwait(false);

        if (!recurrenceNextRunCalculator.IsSupportedCronExpression(cronExpression))
        {
            return this.BadRequestProblem(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        DateTime? nextRunUtc =
            recurrenceNextRunCalculator.ComputeNextRunUtc(cronExpression, now, request.IsEnabled.Value);

        if (request.IsEnabled.Value && nextRunUtc is null)
        {
            return this.BadRequestProblem(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SourceRunId = request.SourceRunId,
            ArchitectureId = sourceRun?.ArchitectureId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Recurring architecture review" : request.Name.Trim(),
            CronExpression = cronExpression,
            IsEnabled = request.IsEnabled.Value,
            CreatedUtc = now,
            CreatedByUserId = actorContext.GetActorId(),
            NextRunUtc = nextRunUtc,
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

    // idempotency-posture: dry-run-no-persist
    [HttpPost("recurrence-schedules/preview-next-runs")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Read-only recurrence schedule preview; no schedule persisted.")]
    [ProducesResponseType(typeof(PreviewRecurrenceScheduleRunsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PreviewRecurrenceScheduleRuns(
        [FromBody] PreviewRecurrenceScheduleRunsRequest? request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.Count is < 1 or > 20)
        {
            return this.BadRequestProblem("Count must be between 1 and 20.", ProblemTypes.ValidationFailed);
        }

        string cronExpression = (request.CronExpression ?? string.Empty).Trim();

        if (!recurrenceNextRunCalculator.IsSupportedCronExpression(cronExpression))
        {
            return Ok(new PreviewRecurrenceScheduleRunsResponse
            {
                IsValid = false,
                ValidationError = RecurrenceScheduleCronValidation.InvalidCronMessage,
                NextRunUtc = Array.Empty<DateTime>(),
            });
        }

        DateTime fromUtc = request.FromUtc ?? TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<DateTime> nextRuns =
            recurrenceNextRunCalculator.ComputeNextRunsUtc(cronExpression, fromUtc, request.Count);

        if (nextRuns.Count == 0)
        {
            return Ok(new PreviewRecurrenceScheduleRunsResponse
            {
                IsValid = false,
                ValidationError = RecurrenceScheduleCronValidation.InvalidCronMessage,
                NextRunUtc = Array.Empty<DateTime>(),
            });
        }

        return Ok(new PreviewRecurrenceScheduleRunsResponse
        {
            IsValid = true,
            NextRunUtc = nextRuns,
        });
    }

    [HttpPut("recurrence-schedules/{scheduleId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureReviewRecurrenceSchedule), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRecurrenceSchedule(
        Guid scheduleId,
        [FromBody] UpdateArchitectureReviewRecurrenceScheduleRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ArchitectureReviewRecurrenceSchedule? existing =
            await recurrenceScheduleRepository.GetByIdAsync(scheduleId, cancellationToken);

        if (existing is null)
            return this.NotFoundProblem("Recurrence schedule was not found.", ProblemTypes.ResourceNotFound);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (existing.TenantId != scope.TenantId
            || existing.WorkspaceId != scope.WorkspaceId
            || existing.ProjectId != scope.ProjectId)
            return this.NotFoundProblem("Recurrence schedule was not found.", ProblemTypes.ResourceNotFound);

        if (request.IsEnabled.HasValue)
            existing.IsEnabled = request.IsEnabled.Value;

        if (!string.IsNullOrWhiteSpace(request.Name))
            existing.Name = request.Name.Trim();

        string cron = existing.CronExpression;

        if (!string.IsNullOrWhiteSpace(request.CronExpression))
        {
            cron = request.CronExpression.Trim();

            if (!recurrenceNextRunCalculator.IsSupportedCronExpression(cron))
            {
                return this.BadRequestProblem(
                    RecurrenceScheduleCronValidation.InvalidCronMessage,
                    ProblemTypes.ValidationFailed);
            }

            existing.CronExpression = cron;
        }

        DateTime updateNow = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime? nextRunUtc =
            recurrenceNextRunCalculator.ComputeNextRunUtc(cron, updateNow, existing.IsEnabled);

        if (existing.IsEnabled && nextRunUtc is null)
        {
            return this.BadRequestProblem(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        existing.NextRunUtc = nextRunUtc;

        await recurrenceScheduleRepository.UpdateAsync(existing, cancellationToken);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureReviewRecurrenceScheduleUpdated,
                DataJson = JsonSerializer.Serialize(new
                {
                    existing.ScheduleId,
                    existing.TenantId,
                    existing.WorkspaceId,
                    existing.ProjectId,
                    existing.CronExpression,
                    existing.IsEnabled,
                }),
            },
            cancellationToken);

        return Ok(existing);
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

    [HttpPost("runs/{runId:guid}/finding-merge-conflicts/{findingId}/resolve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveFindingMergeConflict(
        [FromRoute] Guid runId,
        [FromRoute] string findingId,
        [FromBody] ArchLucid.Contracts.Findings.ResolveFindingMergeConflictRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        bool resolved = await _findingMergeConflictResolutionService.TryResolveAsync(
            scope,
            runId,
            findingId,
            request.Action,
            cancellationToken).ConfigureAwait(false);

        if (!resolved)
            return this.NotFoundProblem("Finding merge conflict was not found.", ProblemTypes.ResourceNotFound);

        return NoContent();
    }
}
