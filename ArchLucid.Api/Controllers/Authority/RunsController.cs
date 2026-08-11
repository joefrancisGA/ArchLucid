using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using FluentValidation;

using System.Security.Cryptography;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for mutating architecture runs: create, execute, commit, replay, submit agent results.
/// </summary>
/// <remarks>
///     Base route <c>v1/architecture</c>. Read-only endpoints live on <see cref="RunQueryController" /> and
///     <see cref="RunAgentEvaluationController" />.
///     Mutating endpoints require <see cref="ArchLucidPolicies.ExecuteAuthority" />; reads use
///     <see cref="ArchLucidPolicies.ReadAuthority" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class RunsController(
    IArchitectureRunCreateOrchestrator architectureRunCreateOrchestrator,
    IArchitectureRunBatchCreateOrchestrator architectureRunBatchCreateOrchestrator,
    IArchitectureRunExecuteOrchestrator architectureRunExecuteOrchestrator,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    IArchitectureApplicationService architectureApplicationService,
    IArchitectureRequestDraftService architectureRequestDraftService,
    IChatIntakeParserService chatIntakeParserService,
    IConnectorIntakeParserService connectorIntakeParserService,
    IValidator<ArchitectureRequest> architectureRequestValidator,
    IReplayRunService replayRunService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    ICommitSponsorEmailNotifier commitSponsorEmailNotifier,
    ICommitRunIdempotencyRepository commitRunIdempotencyRepository,
    IRunRepository runRepository,
    IAuthorityQueryService authorityQuery,
    IFindingFeedbackRepository findingFeedbackRepository,
    ILogger<RunsController> logger)
    : ControllerBase
{
    private readonly IAuthorityQueryService authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IFindingFeedbackRepository findingFeedbackRepository =
        findingFeedbackRepository ?? throw new ArgumentNullException(nameof(findingFeedbackRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    // Required by LoggerMessage source generator (SYSLIB1019): concrete ILogger field named _logger.

    /// <summary>
    ///     Creates a run, evidence bundle, and starter tasks from <paramref name="request" />; supports <c>Idempotency-Key</c>
    ///     replay semantics.
    /// </summary>
    /// <returns>
    ///     201 with <see cref="CreateArchitectureRunResponse" /> for new runs, or 200 with <c>X-Idempotency-Replayed</c>
    ///     header when the key matches a prior success.
    /// </returns>
    /// <remarks>
    ///     Canonical route: <c>POST v1/architecture/request</c>. The deprecated <c>POST /v1/requests</c> alias (TB-305 /
    ///     ADR 0042) was retired once the coordinator strangler migration closed pre-release (ADR 0042 closure note) — there
    ///     is no customer traffic to protect and the canonical route is the only family the UI/CLI ever used.
    /// </remarks>
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

        if (Request.Headers.TryGetValue("Idempotency-Key", out StringValues rawKeyHeader))
        {
            string trimmedKey = rawKeyHeader.ToString().Trim();

            if (trimmedKey.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
                return this.BadRequestProblem(
                    $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.",
                    ProblemTypes.ValidationFailed);
        }

        CreateRunIdempotencyState? idempotency = TryBuildCreateRunIdempotency(request);

        try
        {
            CreateRunResult result =
                await architectureRunCreateOrchestrator.CreateRunAsync(request, idempotency, cancellationToken);

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

    [HttpPost("request/draft")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(DraftArchitectureRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DraftRequest(
        [FromBody] DraftArchitectureRequestInput? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.FreeTextDescription))
            return this.BadRequestProblem("FreeTextDescription is required.", ProblemTypes.ValidationFailed);

        if (input.FreeTextDescription.Trim().Length < 20)
            return this.BadRequestProblem("FreeTextDescription must be at least 20 characters.", ProblemTypes.ValidationFailed);

        DraftArchitectureRequestResponse response = await architectureRequestDraftService.DraftAsync(input, cancellationToken);
        return Ok(response);
    }

    [HttpPost("chat-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Chat intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChatIntake(
        [FromBody] ChatIntakeRequest? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.RawText))
            return this.BadRequestProblem("RawText is required.", ProblemTypes.ValidationFailed);

        if (input.RawText.Trim().Length < 20)
            return this.BadRequestProblem("RawText must be at least 20 characters.", ProblemTypes.ValidationFailed);

        if (input.RawText.Trim().Length > 50_000)
            return this.BadRequestProblem("RawText must not exceed 50000 characters.", ProblemTypes.ValidationFailed);

        ArchitectureRequest parsed;

        try
        {
            parsed = await chatIntakeParserService.ParseAsync(input, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        FluentValidation.Results.ValidationResult validationResult =
            await architectureRequestValidator.ValidateAsync(parsed, cancellationToken);

        if (!validationResult.IsValid)
        {
            string detail = string.Join("; ", validationResult.Errors.Select(static error => error.ErrorMessage));
            return this.UnprocessableEntityProblem(detail, ProblemTypes.ValidationFailed);
        }

        return Ok(parsed);
    }

    /// <summary>Maps Terraform state JSON or a public Git Terraform file into a wizard-ready architecture request.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("connector-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Connector intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConnectorIntake(
        [FromBody] ConnectorIntakeRequest? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.Source))
            return this.BadRequestProblem("Source is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest parsed;

        try
        {
            parsed = await connectorIntakeParserService.ParseAsync(input, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        FluentValidation.Results.ValidationResult validationResult =
            await architectureRequestValidator.ValidateAsync(parsed, cancellationToken);

        if (!validationResult.IsValid)
        {
            string detail = string.Join("; ", validationResult.Errors.Select(static error => error.ErrorMessage));
            return this.UnprocessableEntityProblem(detail, ProblemTypes.ValidationFailed);
        }

        return Ok(parsed);
    }

    /// <summary>
    ///     Creates up to 50 architecture runs in a single call for CI/CD pipelines. Each item in the array is treated as
    ///     an independent <see cref="CreateRun" /> call. Partial failures are captured per item; the overall response is
    ///     always <c>202 Accepted</c>. Supports <c>Idempotency-Key</c> header to prevent duplicate batch processing.
    /// </summary>
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

        BatchCreateRunOrchestrationResult result = await architectureRunBatchCreateOrchestrator.CreateBatchAsync(
            requests,
            BuildBatchCreateRunIdempotency(idempotencyKey, requests),
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

            // The batch response body is not persisted, so a replay confirms acceptance without re-listing items.
            return Ok(new BatchCreateRunResponse { Items = [] });
        }

        return Accepted(
            new BatchCreateRunResponse
            {
                Items = [.. result.Items.Select(RunResponseMapper.ToBatchCreateRunItemResult)]
            });
    }

    private const int BatchCreateRunMaxItems = 50;

    /// <summary>Reads and length-validates the optional <c>Idempotency-Key</c> header.</summary>
    private bool TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badRequest)
    {
        idempotencyKey = null;
        badRequest = null;

        if (!Request.Headers.TryGetValue("Idempotency-Key", out StringValues rawKeyHeader))
            return true;

        string trimmedKey = rawKeyHeader.ToString().Trim();

        if (trimmedKey.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
        {
            badRequest = this.BadRequestProblem(
                $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.",
                ProblemTypes.ValidationFailed);

            return false;
        }

        idempotencyKey = trimmedKey.Length == 0 ? null : trimmedKey;

        return true;
    }

    /// <summary>Fingerprints the whole submitted array so a retry with a different batch payload is rejected.</summary>
    private CreateRunIdempotencyState? BuildBatchCreateRunIdempotency(
        string? idempotencyKey,
        IReadOnlyList<ArchitectureRequest> requests)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return null;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return new CreateRunIdempotencyState(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(idempotencyKey),
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(JsonSerializer.Serialize(requests)));
    }

    private CreateRunIdempotencyState? TryBuildCreateRunIdempotency(ArchitectureRequest request)
    {
        if (!Request.Headers.TryGetValue("Idempotency-Key", out StringValues raw) ||
            string.IsNullOrWhiteSpace(raw.ToString()))
            return null;

        string trimmed = raw.ToString().Trim();

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return new CreateRunIdempotencyState(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(trimmed),
            ArchitectureRunIdempotencyHashing.FingerprintRequest(request));
    }

    /// <summary>
    ///     Dispatches all pending tasks for <paramref name="runId" /> through the agent executor and persists results.
    /// </summary>
    /// <returns><see cref="ExecuteRunResponse" /> with agent results.</returns>
    /// <remarks>
    ///     Canonical route: <c>POST v1/architecture/review/{runId}/execute</c> (ADR 0064).
    /// </remarks>
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
                await architectureRunExecuteOrchestrator.ExecuteRunAsync(runId, cancellationToken);

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

    /// <summary>
    ///     TB-938: re-execute selected agents/tasks for <paramref name="runId" />, keeping successful results and
    ///     invalidating Critic when upstream inputs change.
    /// </summary>
    // idempotency-posture: explicit-idempotency-key
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
            ExecuteRunResult result = await architectureRunExecuteOrchestrator.ExecuteSelectiveRunAsync(
                runId,
                new SelectiveAgentExecuteRequest
                {
                    TaskIds = request.TaskIds,
                    AgentTypes = request.AgentTypes,
                    IncludeDependents = request.IncludeDependents,
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
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            taskIds = request.TaskIds,
                            agentTypes = request.AgentTypes,
                            includeDependents = request.IncludeDependents
                        },
                        AuditJsonSerializationOptions.Instance)
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

    /// <summary>
    ///     Merges agent results through the decision engine and persists the golden manifest and decision traces for
    ///     <paramref name="runId" />.
    /// </summary>
    /// <remarks>
    ///     Canonical route: <c>POST v1/architecture/review/{runId}/finalize</c> (ADR 0064; former path ended in <c>/commit</c>).
    /// </remarks>
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
        byte[] requestFingerprint = ArchitectureRunIdempotencyHashing.FingerprintCommitRequest(request);

        if (!TryParseCommitIdempotencyKeyHeader(out byte[]? idempotencyKeyHash, out IActionResult? badIdempotencyHeader))
        {
            ArgumentNullException.ThrowIfNull(badIdempotencyHeader);
            return badIdempotencyHeader;
        }

        try
        {
            bool markIdempotencyReplayHeader = idempotencyKeyHash is not null &&
                                               await PreviewCommitIdempotencyAsync(scope, canonicalRunKey, idempotencyKeyHash, requestFingerprint,
                                                   cancellationToken);

            CommitRunResult result = await architectureRunCommitOrchestrator.CommitRunAsync(runId, request, cancellationToken);

            CommitRunResponse response = RunResponseMapper.ToCommitRunResponse(
                result.Manifest,
                result.DecisionTraces,
                result.Warnings);

            if (idempotencyKeyHash is not null)
            {
                bool inserted =
                    await commitRunIdempotencyRepository.TryInsertAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, canonicalRunKey,
                        idempotencyKeyHash, requestFingerprint, cancellationToken);

                if (!inserted)
                    markIdempotencyReplayHeader = true;
            }

            if (markIdempotencyReplayHeader)
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

            if (request?.NotifySponsor != true)
                return Ok(response);

            if (!markIdempotencyReplayHeader)
            {
                await commitSponsorEmailNotifier
                    .NotifyAfterCommitAsync(scope.TenantId, runId, cancellationToken);
            }

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

    private bool TryParseCommitIdempotencyKeyHeader(out byte[]? idempotencyKeyHash, out IActionResult? badRequest)
    {
        idempotencyKeyHash = null;
        badRequest = null;

        if (!Request.Headers.TryGetValue("Idempotency-Key", out StringValues keys))
            return true;

        string trimmed = keys.ToString().Trim();

        if (string.IsNullOrEmpty(trimmed))
            return true;

        if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
        {
            badRequest =
                this.BadRequestProblem(
                    $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.",
                    ProblemTypes.ValidationFailed);

            return false;
        }

        idempotencyKeyHash = ArchitectureRunIdempotencyHashing.HashIdempotencyKey(trimmed);

        return true;
    }

    private async Task<bool> PreviewCommitIdempotencyAsync(
        ScopeContext scope,
        string canonicalRunKey,
        byte[] idempotencyKeyHash,
        byte[] requestFingerprint,
        CancellationToken cancellationToken)
    {
        CommitRunIdempotencyLookup? lookup = await commitRunIdempotencyRepository
            .TryGetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, canonicalRunKey, idempotencyKeyHash, cancellationToken);

        if (lookup is null)
            return false;

        if (!CryptographicOperations.FixedTimeEquals(lookup.RequestFingerprint, requestFingerprint))
            throw new ConflictException("Idempotency-Key was reused with a different request payload.");

        return true;
    }

    /// <summary>
    ///     Re-executes agents for <paramref name="runId" /> from cloned tasks/evidence, optionally committing a replay manifest.
    /// </summary>
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
            ReplayRunResult result = await replayRunService.ReplayAsync(
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
            string auditActor = actorContext.GetActor();
            Guid? auditRunId = Guid.TryParse(result.OriginalRunId, out Guid originalParsed) ? originalParsed : null;

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ReplayExecuted,
                    ActorUserId = auditActor,
                    ActorUserName = auditActor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = auditRunId,
                    CorrelationId = correlationId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        result.OriginalRunId,
                        result.ReplayRunId,
                        resolvedExecutionMode = result.ExecutionMode,
                        requestedExecutionMode = request.ExecutionMode,
                        request.CommitReplay,
                        request.ManifestVersionOverride
                    },
                        AuditJsonSerializationOptions.Instance)
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

    /// <summary>
    ///     Pins or unpins <paramref name="runId" /> for workspace curation. When the body omits
    ///     <see cref="PinRunRequest.IsPinned" />, toggles the current stored value.
    /// </summary>
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
            return this.BadRequestProblem("runId must be a valid GUID.", ProblemTypes.ValidationFailed);

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
                DataJson = JsonSerializer.Serialize(
                    new { isPinned = run.IsPinned },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(new PinRunResponse { RunId = run.RunId.ToString("N"), IsPinned = run.IsPinned });
    }

    /// <summary>
    ///     Accepts one <see cref="ArchLucid.Contracts.Agents.AgentResult" /> for an in-progress run (custom agent
    ///     integrations).
    /// </summary>
    /// <remarks>
    ///     TB-305 / ADR 0042: append-only extension point. The application service only accepts results while the run is in
    ///     <c>TasksGenerated</c> or <c>WaitingForResults</c> (see
    ///     <c>RunStateTransitionService.ValidateResultSubmissionAllowed</c>); it cannot finalize/commit a run or mutate a
    ///     committed one, so it can never bypass the commit orchestrator.
    /// </remarks>
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

    /// <summary>
    ///     Gets the original architecture request payload by ID.
    /// </summary>
    [HttpGet("request/{requestId}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        return Ok(request);
    }

    /// <summary>
    ///     Clones an existing architecture request, stripping its ID so it can be used as a template for a new run.
    /// </summary>
    [IdempotencyFilter]
    [HttpPost("request/{requestId}/clone")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloneRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        // Strip the ID to make it a template for a new request
        request.RequestId = Guid.NewGuid().ToString("N");
        request.IsArchived = false;

        return Ok(request);
    }

    /// <summary>
    ///     Archives an architecture request, hiding it from default list views.
    /// </summary>
    [HttpPatch("request/{requestId}/archive")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        await requestRepository.ArchiveAsync(requestId, cancellationToken);

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = "ArchitectureRequestArchived",
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { requestId },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok();
    }

    /// <summary>
    ///     Soft-deletes an architecture request by marking it archived (hidden from default list views).
    /// </summary>
    [HttpDelete("request/{requestId}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        if (request.IsArchived)
            return Ok();

        await requestRepository.ArchiveAsync(requestId, cancellationToken);

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = "ArchitectureRequestDeleted",
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { requestId },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok();
    }

    /// <summary>
    ///     Restores an archived architecture request so it appears in default list views again.
    /// </summary>
    [IdempotencyFilter]
    [HttpPost("request/{requestId}/restore")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        if (!request.IsArchived)
            return Ok();

        await requestRepository.RestoreAsync(requestId, cancellationToken);

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = "ArchitectureRequestRestored",
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { requestId },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok();
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

    private static Guid? TryParseRunGuidForAudit(string runId)
    {
        return TryParseRunGuidForAudit(runId, out Guid g) ? g : null;
    }

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
