using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using System.Text.Json;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    /// <summary>
    ///     Accepts create work and returns <c>202</c> with <c>Location: /v1/operations/run:{runId}</c> (Tier C create).
    /// </summary>
    [HttpPost("request/async")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [AsyncRequired]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> AcceptCreateRunAsync(
        [FromBody] ArchitectureRequest? request,
        [FromServices] IArchitectureRunAsyncOperationAcceptor asyncOperationAcceptor,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        FluentValidation.Results.ValidationResult validationResult =
            await architectureRequestValidator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return this.BadRequestProblem(
                string.Join("; ", validationResult.Errors.Select(error => error.ErrorMessage)),
                ProblemTypes.ValidationFailed);
        }

        if (!TryReadIdempotencyKeyHeader(out string? idempotencyKey, out IActionResult? badIdempotencyHeader))
        {
            ArgumentNullException.ThrowIfNull(badIdempotencyHeader);
            return badIdempotencyHeader;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();
        CreateRunIdempotencyState? idempotency = BuildAsyncCreateIdempotency(scope, idempotencyKey, request);

        try
        {
            string operationId = await asyncOperationAcceptor.AcceptCreateAsync(
                request,
                idempotency,
                scope,
                actor,
                HttpContext.TraceIdentifier,
                cancellationToken);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RequestCreated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            requestId = request.RequestId,
                            operationId,
                            asyncCreateAccepted = true
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            Response.Headers.Location = $"/v1/operations/{operationId}";
            return StatusCode(StatusCodes.Status202Accepted);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.InvalidOperationProblem(ex, ProblemTypes.BadRequest);
        }
    }

    private static CreateRunIdempotencyState? BuildAsyncCreateIdempotency(
        ScopeContext scope,
        string? idempotencyKey,
        ArchitectureRequest request)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return null;

        return new CreateRunIdempotencyState(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(idempotencyKey),
            ArchitectureRunIdempotencyHashing.FingerprintRequest(request));
    }

    /// <summary>
    ///     Accepts execute work and returns <c>202</c> with <c>Location: /v1/operations/run:{runId}</c> (TB-2075).
    /// </summary>
    [HttpPost("review/{runId}/execute/async")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [AsyncRequired]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ExecuteRunAsync(
        [FromRoute] string runId,
        [FromServices] IArchitectureRunAsyncOperationAcceptor asyncOperationAcceptor,
        CancellationToken cancellationToken)
    {
        try
        {
            string operationId = await asyncOperationAcceptor.AcceptExecuteAsync(
                runId,
                scopeContextProvider.GetCurrentScope(),
                actorContext.GetActor(),
                HttpContext.TraceIdentifier,
                cancellationToken);

            ScopeContext executeScope = scopeContextProvider.GetCurrentScope();
            string executeActor = actorContext.GetActor();

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunSubmitted,
                    ActorUserId = executeActor,
                    ActorUserName = executeActor,
                    TenantId = executeScope.TenantId,
                    WorkspaceId = executeScope.WorkspaceId,
                    ProjectId = executeScope.ProjectId,
                    RunId = TryParseRunGuidForAudit(runId),
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new { runId, operationId, asyncAccepted = true },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            Response.Headers.Location = $"/v1/operations/{operationId}";
            return StatusCode(StatusCodes.Status202Accepted);
        }
        catch (Exception ex) when (AuthorityRunProblemLadder.CanMap(ex))
        {
            return AuthorityRunProblemLadder.Map(this, ex);
        }
    }

    /// <summary>
    ///     Accepts replay work and returns <c>202</c> with <c>Location: /v1/operations/run:{replayRunId}</c> (TB-2075).
    /// </summary>
    [HttpPost("review/{runId}/replay/async")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [AsyncRequired]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ReplayRunAsync(
        [FromRoute] string runId,
        [FromBody] ReplayRunRequest? request,
        [FromServices] IArchitectureRunAsyncOperationAcceptor asyncOperationAcceptor,
        CancellationToken cancellationToken)
    {
        request ??= new ReplayRunRequest();

        try
        {
            string operationId = await asyncOperationAcceptor.AcceptReplayAsync(
                runId,
                request.ExecutionMode,
                request.CommitReplay,
                request.ManifestVersionOverride,
                scopeContextProvider.GetCurrentScope(),
                actorContext.GetActor(),
                HttpContext.TraceIdentifier,
                cancellationToken);

            ScopeContext replayScope = scopeContextProvider.GetCurrentScope();
            string replayActor = actorContext.GetActor();

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunSubmitted,
                    ActorUserId = replayActor,
                    ActorUserName = replayActor,
                    TenantId = replayScope.TenantId,
                    WorkspaceId = replayScope.WorkspaceId,
                    ProjectId = replayScope.ProjectId,
                    RunId = TryParseRunGuidForAudit(runId),
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            originalRunId = runId,
                            operationId,
                            request.ExecutionMode,
                            request.CommitReplay,
                            request.ManifestVersionOverride,
                            asyncReplayAccepted = true
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            Response.Headers.Location = $"/v1/operations/{operationId}";
            return StatusCode(StatusCodes.Status202Accepted);
        }
        catch (Exception ex) when (AuthorityRunProblemLadder.CanMap(ex))
        {
            return AuthorityRunProblemLadder.Map(this, ex);
        }
    }
}
