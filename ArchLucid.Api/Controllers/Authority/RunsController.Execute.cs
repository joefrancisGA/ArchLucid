using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run execution endpoints.</summary>
public sealed partial class RunsController
{
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
            ExecuteRunResult result =
                await runLifecycleCommandService.ExecuteRunAsync(runId, cancellationToken);

            ExecuteRunResponse response = RunResponseMapper.ToExecuteRunResponse(result.RunId, result.Results);

            LogRunExecuted(runId, result.Results.Count, user, correlationId);

            await LogRunSubmittedAuditAsync(runId, user, cancellationToken);

            if (!pilotTryRealMode)
                return Ok(response);

            ArchLucidInstrumentation.RecordTryRealModePilotAttempted();
            await LogPilotTryRealModeAuditAsync(
                AuditEventTypes.FirstRealValueRunStarted,
                runId,
                user,
                cancellationToken);

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
}
