using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    /// <summary>Recovers a prior create-run response via the <c>Idempotency-Key</c> header (header keeps the key out of path access logs).</summary>
    [HttpGet("request/idempotency")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(CreateArchitectureRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LookupCreateRunByIdempotencyKey(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return this.BadRequestProblem("Idempotency-Key header is required.", ProblemTypes.ValidationFailed);

        IdempotencyKeyValidationResult validation =
            runLifecycleCommandService.ValidateIdempotencyKey(idempotencyKey);

        if (!validation.IsValid || string.IsNullOrWhiteSpace(validation.Key))
            return this.BadRequestProblem(validation.ErrorMessage ?? "Idempotency-Key is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        CreateRunResult? result = await runLifecycleCommandService
            .LookupCreateRunByIdempotencyKeyAsync(scope, validation.Key, cancellationToken);

        if (result is null)
            return this.NotFoundProblem("Idempotency-Key not found.", ProblemTypes.ResourceNotFound);

        CreateArchitectureRunResponse response =
            RunResponseMapper.ToCreateRunResponse(result.Run, result.EvidenceBundle, result.Tasks);

        Response.Headers.Append("X-Idempotency-Replayed", "true");

        return Ok(response);
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
