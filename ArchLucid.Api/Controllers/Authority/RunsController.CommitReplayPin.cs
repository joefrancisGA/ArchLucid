using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run commit, replay, and pin endpoints.</summary>
public sealed partial class RunsController
{
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
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
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
}
