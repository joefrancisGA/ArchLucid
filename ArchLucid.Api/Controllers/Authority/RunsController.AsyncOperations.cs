using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Async;
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
