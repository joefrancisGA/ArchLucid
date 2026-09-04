using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

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
        IActionResult? invalidRun = NotFoundWhenRunRouteIdInvalid(runId);

        if (invalidRun is not null)
            return invalidRun;

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
                result.Warnings,
                result.CommittedArtifactInventory);

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
}
