using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Models;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for mutating architecture runs: create, execute, commit, replay, submit agent results.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class RunsController(
    IRunLifecycleCommandService runLifecycleCommandService,
    IArchitectureApplicationService architectureApplicationService,
    IArchitectureRequestDraftService architectureRequestDraftService,
    IArchitectureOverviewRewriteService architectureOverviewRewriteService,
    IClarificationAnswerRephraseService clarificationAnswerRephraseService,
    IStructuredBriefSuggestionExplainService structuredBriefSuggestionExplainService,
    IChatIntakeParserService chatIntakeParserService,
    IConnectorIntakeParserService connectorIntakeParserService,
    IValidator<ArchitectureRequest> architectureRequestValidator,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IAuthorityQueryService authorityQuery,
    IFindingFeedbackRepository findingFeedbackRepository,
    IRunRepository runRepository,
    ILogger<RunsController> logger)
    : ControllerBase
{
    private readonly IAuthorityQueryService authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IFindingFeedbackRepository findingFeedbackRepository =
        findingFeedbackRepository ?? throw new ArgumentNullException(nameof(findingFeedbackRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    // idempotency-posture: explicit-idempotency-key
    [HttpPost("request")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(CreateArchitectureRunResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(CreateArchitectureRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateRun(
        [FromBody] ArchitectureRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (!TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badIdempotencyHeader))
        {
            ArgumentNullException.ThrowIfNull(badIdempotencyHeader);
            return badIdempotencyHeader;
        }

        try
        {
            CreateRunCommandResult commandResult = await runLifecycleCommandService.CreateRunAsync(
                scope,
                request,
                idempotencyKey,
                cancellationToken);

            if (commandResult.IsSynthesisPath)
            {
                ArchitectureSynthesisGenerateResult generated = commandResult.SynthesisResult!;

                ArchitectureRun createdRun = new()
                {
                    RunId = generated.RunId,
                    RequestId = request.RequestId,
                    Status = ArchitectureRunStatus.Created
                };

                CreateArchitectureRunResponse generatedResponse =
                    RunResponseMapper.ToCreateRunResponse(createdRun, new EvidenceBundle(), []);

                LogRunCreated(generated.RunId, request.RequestId, user, correlationId);

                return CreatedAtAction(
                    nameof(RunQueryController.GetRun),
                    "RunQuery",
                    new { runId = generated.RunId },
                    generatedResponse);
            }

            CreateRunResult result = commandResult.StandardResult!;

            CreateArchitectureRunResponse response =
                RunResponseMapper.ToCreateRunResponse(result.Run, result.EvidenceBundle, result.Tasks);

            LogRunCreated(result.Run.RunId, request.RequestId, user, correlationId);

            if (!result.IdempotentReplay)
                return CreatedAtAction(
                    nameof(RunQueryController.GetRun),
                    "RunQuery",
                    new { runId = result.Run.RunId },
                    response);

            Response.Headers.Append("X-Idempotency-Replayed", "true");
            LogIdempotencyReplay(request.RequestId, user, correlationId);

            return Ok(response);
        }
        catch (ConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "CreateRun conflict for request '{RequestId}'.",
                request.RequestId);

            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "CreateRun failed for request '{RequestId}'.", request.RequestId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BadRequest);
        }
    }

    [HttpPost("request/batch")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [ProducesResponseType(typeof(BatchCreateRunResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(BatchCreateRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateRunBatch(
        [FromBody] IReadOnlyList<ArchitectureRequest>? requests,
        CancellationToken cancellationToken)
    {
        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;

        if (requests is null || requests.Count == 0)
            return this.BadRequestProblem("Request body must be a non-empty JSON array.", ProblemTypes.ValidationFailed);

        if (requests.Count > BatchCreateRunMaxItems)
            return this.BadRequestProblem(
                $"Batch may contain at most {BatchCreateRunMaxItems} items. Received {requests.Count}.",
                ProblemTypes.ValidationFailed);

        if (!TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badRequest))
            return badRequest!;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        BatchCreateRunOrchestrationResult result = await runLifecycleCommandService.CreateRunBatchAsync(
            scope,
            requests,
            idempotencyKey,
            correlationId,
            cancellationToken);

        if (result.Outcome == BatchCreateRunOutcome.IdempotencyKeyPayloadMismatch)
            return this.ConflictProblem(
                "Idempotency-Key was reused with a different request payload.",
                ProblemTypes.Conflict);

        if (result.Outcome == BatchCreateRunOutcome.IdempotentReplay)
        {
            Response.Headers.Append("X-Idempotency-Replayed", "true");
            LogIdempotencyReplay("batch", user, correlationId);

            return Ok(new BatchCreateRunResponse { Items = [] });
        }

        return Accepted(
            new BatchCreateRunResponse
            {
                Items = [.. result.Items.Select(RunResponseMapper.ToBatchCreateRunItemResult)]
            });
    }

    private const int BatchCreateRunMaxItems = 50;

    private bool TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badRequest)
    {
        idempotencyKey = null;
        badRequest = null;

        if (!Request.Headers.TryGetValue("Idempotency-Key", out StringValues rawKeyHeader))
            return true;

        IdempotencyKeyValidationResult validation =
            runLifecycleCommandService.ValidateIdempotencyKey(rawKeyHeader.ToString());

        if (!validation.IsValid)
        {
            badRequest = this.BadRequestProblem(validation.ErrorMessage!, ProblemTypes.ValidationFailed);
            return false;
        }

        idempotencyKey = validation.Key;
        return true;
    }

    [HttpPost("review/{runId}/execute")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ExecuteRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ExecuteRun(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;
        bool pilotTryRealMode = IsPilotTryRealModeRequest();

        try
        {
            if (pilotTryRealMode)
            {
                ArchLucidInstrumentation.RecordTryRealModePilotAttempted();
                await LogPilotTryRealModeAuditAsync(
                    AuditEventTypes.FirstRealValueRunStarted,
                    runId,
                    user,
                    cancellationToken);
            }

            ExecuteRunResult result =
                await runLifecycleCommandService.ExecuteRunAsync(runId, cancellationToken);

            ExecuteRunResponse response = RunResponseMapper.ToExecuteRunResponse(result.RunId, result.Results);

            LogRunExecuted(runId, result.Results.Count, user, correlationId);

            await LogRunSubmittedAuditAsync(runId, user, cancellationToken);

            if (!pilotTryRealMode)
                return Ok(response);

            ArchLucidInstrumentation.RecordTryRealModePilotSucceeded();
            await LogPilotTryRealModeAuditAsync(
                AuditEventTypes.FirstRealValueRunCompleted,
                runId,
                user,
                cancellationToken);

            return Ok(response);
        }
        catch (ConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ExecuteRun conflict for run '{RunId}'.", runId);
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ExecuteRun failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BadRequest);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/{runId}/execute/selective")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ExecuteRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ExecuteRunSelective(
        [FromRoute] string runId,
        [FromBody] SelectiveExecuteRunRequest? body,
        CancellationToken cancellationToken)
    {
        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;
        SelectiveExecuteRunRequest request = body ?? new SelectiveExecuteRunRequest();

        try
        {
            ExecuteRunResult result = await runLifecycleCommandService.ExecuteRunSelectiveAsync(
                runId,
                new SelectiveAgentExecuteRequest
                {
                    TaskIds = request.TaskIds,
                    AgentTypes = request.AgentTypes,
                    IncludeDependents = request.IncludeDependents,
                    AffectedElementIds = request.AffectedElementIds,
                },
                cancellationToken);

            ExecuteRunResponse response = RunResponseMapper.ToExecuteRunResponse(result.RunId, result.Results);

            LogRunExecuted(runId, result.Results.Count, user, correlationId);

            ScopeContext selectiveScope = scopeContextProvider.GetCurrentScope();
            Guid? selectiveRunGuid = TryParseRunGuidForAudit(runId);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.Run.SelectiveExecuteRequested,
                    ActorUserId = user,
                    ActorUserName = user,
                    TenantId = selectiveScope.TenantId,
                    WorkspaceId = selectiveScope.WorkspaceId,
                    ProjectId = selectiveScope.ProjectId,
                    RunId = selectiveRunGuid,
                    CorrelationId = correlationId,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(
                        new
                        {
                            taskIds = request.TaskIds,
                            agentTypes = request.AgentTypes,
                            includeDependents = request.IncludeDependents
                        },
                        Persistence.Serialization.AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            return Ok(response);
        }
        catch (ConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ExecuteRunSelective conflict for run '{RunId}'.", runId);
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ExecuteRunSelective failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BadRequest);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    // idempotency-posture: explicit-idempotency-key
    [HttpPost("review/{runId}/finalize")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = ArchLucidPolicies.CanCommitRuns)]
    [ProducesResponseType(typeof(CommitRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CommitRun(
        [FromRoute] string runId,
        [FromBody] CommitRunRequest? request,
        CancellationToken cancellationToken)
    {
        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string canonicalRunKey = ArchitectureRunRouteIds.NormalizeForScopeKey(runId);

        if (!TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badIdempotencyHeader))
        {
            ArgumentNullException.ThrowIfNull(badIdempotencyHeader);
            return badIdempotencyHeader;
        }

        try
        {
            CommitRunIdempotencyOutcome outcome = await runLifecycleCommandService.CommitRunAsync(
                scope,
                runId,
                request,
                idempotencyKey,
                cancellationToken);

            CommitRunResult result = outcome.Result;

            CommitRunResponse response = RunResponseMapper.ToCommitRunResponse(
                result.Manifest,
                result.DecisionTraces,
                result.Warnings);

            if (outcome.IdempotentReplay)
            {
                Response.Headers.Append("X-Idempotency-Replayed", "true");
                LogIdempotencyReplay(runId, user, correlationId);
            }

            LogRunCommitted(
                canonicalRunKey,
                result.Manifest.Metadata.ManifestVersion,
                result.Warnings.Count,
                user,
                correlationId);

            return Ok(response);
        }
        catch (PreCommitGovernanceBlockedException ex)
        {
            logger.LogWarningWithSanitizedUserArg(
                ex,
                "CommitRun blocked by pre-commit governance for run '{RunId}'.",
                runId);
            return this.GovernancePreCommitBlockedProblem(ex.Result);
        }
        catch (GoldenManifestSchemaValidationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "CommitRun schema validation failed for run '{RunId}'.", runId);
            return this.GoldenManifestSchemaValidationProblem(ex.Result);
        }
        catch (ConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "CommitRun conflict for run '{RunId}'.", runId);
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "CommitRun failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BusinessRuleViolation);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/{runId}/replay")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ReplayRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ReplayRun(
        [FromRoute] string runId,
        [FromBody] ReplayRunRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ReplayRunRequest();

        string user = actorContext.GetActor();
        string correlationId = HttpContext.TraceIdentifier;

        try
        {
            ReplayRunResult result = await runLifecycleCommandService.ReplayRunAsync(
                runId,
                request.ExecutionMode,
                request.CommitReplay,
                request.ManifestVersionOverride,
                cancellationToken);

            ReplayRunResponse response = RunResponseMapper.ToReplayRunResponse(
                result.OriginalRunId,
                result.ReplayRunId,
                result.ExecutionMode,
                result.Results,
                result.Manifest,
                result.DecisionTraces,
                result.Warnings);

            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            Guid? auditRunId = Guid.TryParse(result.OriginalRunId, out Guid originalParsed) ? originalParsed : null;

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ReplayExecuted,
                    ActorUserId = user,
                    ActorUserName = user,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = auditRunId,
                    CorrelationId = correlationId,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        result.OriginalRunId,
                        result.ReplayRunId,
                        resolvedExecutionMode = result.ExecutionMode,
                        requestedExecutionMode = request.ExecutionMode,
                        request.CommitReplay,
                        request.ManifestVersionOverride
                    },
                        Persistence.Serialization.AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            logger.LogInformationInternalArchitectureRunReplayed(
                result.OriginalRunId,
                result.ReplayRunId,
                result.ExecutionMode,
                user,
                correlationId);

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "ReplayRun failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BusinessRuleViolation);
        }
    }

    [HttpPatch("review/{runId}/pin")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(PinRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PinRun(
        [FromRoute] string runId,
        [FromBody] PinRunRequest? request,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuidForAudit(runId, out Guid runGuid))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        bool nextPinned = request?.IsPinned ?? !run.IsPinned;
        run.IsPinned = nextPinned;

        try
        {
            await _runRepository.UpdateAsync(run, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }

        string auditActor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunPinStateChanged,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runGuid,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = System.Text.Json.JsonSerializer.Serialize(
                    new { isPinned = run.IsPinned },
                    Persistence.Serialization.AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(new PinRunResponse { RunId = run.RunId.ToString("N"), IsPinned = run.IsPinned });
    }

    [IdempotencyFilter]
    [HttpPost("review/{runId}/result")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(SubmitAgentResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitAgentResult(
        [FromRoute] string runId,
        [FromBody] SubmitAgentResultRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        SubmitResultResult result =
            await architectureApplicationService.SubmitAgentResultAsync(runId, request.Result, cancellationToken);

        return result.Success
            ? Ok(new SubmitAgentResultResponse { ResultId = result.ResultId! })
            : MapApplicationServiceFailure(result.Error, result.FailureKind, "Submission failed.");
    }

    private async Task LogRunSubmittedAuditAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? runGuid = TryParseRunGuidForAudit(runId);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunSubmitted,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runGuid
            },
            cancellationToken);
    }

    private bool IsPilotTryRealModeRequest()
    {
        return Request.Headers.TryGetValue(PilotTryRealModeHeaders.PilotTryRealMode, out StringValues raw) &&
               string.Equals(raw.ToString().Trim(), "1", StringComparison.Ordinal);
    }

    private async Task LogPilotTryRealModeAuditAsync(
        string eventType,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? runGuid = TryParseRunGuidForAudit(runId);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runGuid
            },
            cancellationToken);
    }

    private static bool TryParseRunGuidForAudit(string runId, out Guid runGuid)
    {
        if (Guid.TryParseExact(runId, "N", out runGuid))
            return true;

        return Guid.TryParse(runId, out runGuid);
    }

    private static Guid? TryParseRunGuidForAudit(string runId) =>
        TryParseRunGuidForAudit(runId, out Guid g) ? g : null;

    private IActionResult MapApplicationServiceFailure(string? error, ApplicationServiceFailureKind? kind,
        string defaultBadRequestDetail)
    {
        string detail = string.IsNullOrWhiteSpace(error) ? defaultBadRequestDetail : error;
        return kind switch
        {
            ApplicationServiceFailureKind.RunNotFound => this.NotFoundProblem(detail, ProblemTypes.RunNotFound),
            ApplicationServiceFailureKind.ResourceNotFound => this.NotFoundProblem(detail,
                ProblemTypes.ResourceNotFound),
            ApplicationServiceFailureKind.Conflict => this.ConflictProblem(detail, ProblemTypes.Conflict),
            _ => this.BadRequestProblem(detail)
        };
    }
}
