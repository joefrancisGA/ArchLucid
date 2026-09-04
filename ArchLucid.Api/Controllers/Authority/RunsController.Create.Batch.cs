using ArchLucid.Api.Attributes;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
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
}
