using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    [IdempotencyFilter]
    [HttpPost("findings/{findingId}/dispositions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(FindingDispositionEventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IFindingReviewTrailAppendService logs FindingReviewDispositionRecorded via IAuditService.")]
    public async Task<IActionResult> RecordDisposition(
        string findingId,
        [FromBody] RecordFindingDispositionRequest? request,
        CancellationToken cancellationToken = default)
    {
        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        RecordFindingDispositionRequest normalized = new()
        {
            FindingId = findingId,
            RunId = request.RunId,
            Disposition = request.Disposition,
            Rationale = request.Rationale,
            RevisitDueUtc = request.RevisitDueUtc,
            EvidenceRequestText = request.EvidenceRequestText,
        };

        try
        {
            FindingDispositionEventDto result =
                await _facade.RecordDispositionAsync(normalized, cancellationToken);

            return Ok(result);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [IdempotencyFilter]
    [HttpPost("findings/bulk-disposition")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecordBulkFindingDispositionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IFindingReviewTrailAppendService logs FindingReviewDispositionRecorded via IAuditService.")]
    public async Task<IActionResult> RecordBulkDisposition(
        [FromBody] RecordBulkFindingDispositionRequest? request,
        CancellationToken cancellationToken = default)
    {
        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.FindingIds is null || request.FindingIds.Count == 0)
            return this.BadRequestProblem("At least one FindingId must be provided.", ProblemTypes.ValidationFailed);

        RecordBulkFindingDispositionResponse response;

        try
        {
            response = await _facade.RecordBulkDispositionAsync(request, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return Ok(response);
    }

    [HttpGet("findings/{findingId}/dispositions")]
    [ProducesResponseType(typeof(IReadOnlyList<FindingDispositionEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDispositions(string findingId, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<FindingDispositionEventDto> history =
            await _facade.ListDispositionsAsync(findingId, cancellationToken);

        return Ok(history);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId:guid}/finding-merge-conflicts/{findingId}/resolve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IGovernanceStickinessFacade.TryResolveFindingMergeConflictAsync logs FindingMergeConflictResolved.")]
    public async Task<IActionResult> ResolveFindingMergeConflict(
        [FromRoute] Guid runId,
        [FromRoute] string findingId,
        [FromBody] ArchLucid.Contracts.Findings.ResolveFindingMergeConflictRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            bool resolved = await _facade.TryResolveFindingMergeConflictAsync(
                runId,
                findingId,
                request,
                cancellationToken).ConfigureAwait(false);

            if (!resolved)
                return this.NotFoundProblem("Finding merge conflict was not found.", ProblemTypes.ResourceNotFound);

            return NoContent();
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }
}
