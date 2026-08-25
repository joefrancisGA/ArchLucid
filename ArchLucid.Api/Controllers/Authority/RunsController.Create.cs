using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run creation endpoints and idempotency header handling.</summary>
public sealed partial class RunsController
{
    private const int BatchCreateRunMaxItems = 50;

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
}
