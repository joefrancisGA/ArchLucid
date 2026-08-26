using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityQueryController
{
    [HttpGet("reviews/{runId:guid}/summary")]
    [ProducesResponseType(typeof(RunSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRunSummary(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunSummaryDto? result = await queryService.GetRunSummaryAsync(scope, runId, ct);
        return result is null
            ? this.NotFoundProblem($"Run summary '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(AuthorityRunReadHandlers.ToRunSummaryResponse(result));
    }

    /// <summary>Loads full run detail including hydrated snapshots and golden manifest when available.</summary>
    /// <remarks>Prefer <c>GET /v1/runs/{runId}</c> (<see cref="AuthorityReadsController.GetRunDetail" />).</remarks>
    [Obsolete("Prefer GET /v1/runs/{runId}. Retained for backward compatibility.")]
    [HttpGet("reviews/{runId:guid}")]
    [ProducesResponseType(typeof(RunDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRunDetail(
        Guid runId,
        CancellationToken ct = default)
    {
        RunDetailDto? result = await readHandlers.GetRunDetailAsync(runId, ct);

        return result is null
            ? this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(result);
    }

    /// <summary>Buyer-proof run detail — whitelisted fields only; no embedded snapshots (TB-283).</summary>
    [HttpGet("reviews/{runId:guid}/buyer-summary")]
    [ProducesResponseType(typeof(BuyerRunDetailSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBuyerRunDetailSummary(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? result = await queryService.GetRunDetailForBuyerSummaryAsync(scope, runId, ct);

        if (result is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        result.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            result.Run.RealModeFellBackToSimulator,
            _effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        try
        {
            await runDetailOperatorEnricher
                .EnrichBuyerSummaryAsync(result, _effectiveAgentExecutionModeAccessor.GetEffectiveMode(), ct)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Buyer-summary enrichment failed for run {RunId}; returning unenriched proof DTO.", runId);
        }

        BuyerRunDetailSummaryDto buyerSummary = RunDetailBuyerMapper.Map(result);

        return Ok(buyerSummary);
    }

    /// <summary>Records run-level approve / reject / request-remediation (TB-112).</summary>
    // idempotency-posture: explicit-idempotency-key
    [IdempotencyFilter]
    [HttpPost("reviews/{runId:guid}/disposition")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RunOperatorGovernanceDispositionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IRunOperatorGovernanceDispositionService logs RunOperatorGovernanceDispositionRecorded.")]
    public async Task<IActionResult> RecordRunOperatorGovernanceDisposition(
        Guid runId,
        [FromBody] RecordRunOperatorGovernanceDispositionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await queryService.GetRunDetailAsync(scope, runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        bool hasCommitBlockingFailures = detail.FindingCoverageSummary?.HasCommitBlockingFailures == true;

        try
        {
            RunOperatorGovernanceDispositionDto result = await runOperatorGovernanceDispositionService.RecordAsync(
                runId,
                request,
                scope,
                actorContext.GetActorId(),
                hasCommitBlockingFailures,
                ct);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (KeyNotFoundException)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }
    }

    /// <summary>Returns redaction-safe retrieval grounding diagnostics for one run.</summary>
    [HttpGet("reviews/{runId:guid}/retrieval-grounding")]
    [ProducesResponseType(typeof(RunRetrievalGroundingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRunRetrievalGrounding(
        Guid runId,
        CancellationToken ct = default)
    {
        RunRetrievalGroundingResponse? result =
            await runRetrievalGroundingService.BuildAsync(runId.ToString("D"), ct);

        if (result is null)
            return this.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);

        return Ok(result);
    }
}
