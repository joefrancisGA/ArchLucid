using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.FindingDisposition;
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
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: IFindingReviewTrailAppendService logs FindingReviewDispositionRecorded via IAuditService.")]
    public async Task<IActionResult> RecordDisposition(
        string findingId,
        [FromBody] RecordFindingDispositionRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        RecordFindingDispositionRequest body = request
            ?? throw new InvalidOperationException("Disposition request body was required.");

        IActionResult? findingIdProblem =
            GovernanceStickinessControllerCore.ValidateFindingId(findingId, out findingId)
                .ToBadRequestProblemOrNull(this);

        if (findingIdProblem is not null)
            return findingIdProblem;

        IActionResult? routeFindingIdProblem =
            GovernanceStickinessHttpMapper.ValidateRecordDispositionRouteFindingId(findingId, body)
                .ToBadRequestProblemOrNull(this);

        if (routeFindingIdProblem is not null)
            return routeFindingIdProblem;

        IActionResult? runIdProblem = null;

        if (body.RunId.HasValue)
        {
            runIdProblem = GovernanceStickinessControllerCore.ValidateRunId(body.RunId)
                .ToBadRequestProblemOrNull(this);
        }

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? dispositionValidation =
            GovernanceStickinessHttpMapper.ValidateRecordDisposition(body).ToBadRequestProblemOrNull(this);

        if (dispositionValidation is not null)
            return dispositionValidation;

        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        RecordFindingDispositionRequest normalized = new()
        {
            FindingId = findingId,
            RunId = body.RunId,
            Disposition = body.Disposition,
            Rationale = body.Rationale,
            TradeOffAcknowledgment = body.TradeOffAcknowledgment,
            RevisitDueUtc = body.RevisitDueUtc,
            EvidenceRequestText = body.EvidenceRequestText,
            ExpectedCurrentDispositionRowVersionBase64 = body.ExpectedCurrentDispositionRowVersionBase64,
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
        catch (FindingDispositionConflictException ex)
        {
            return this.ConflictProblem(
                ex.Message,
                ProblemTypes.Conflict,
                extensions: new Dictionary<string, object?>
                {
                    ["currentDisposition"] = ex.CurrentDisposition,
                });
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
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? findingIdsProblem =
            GovernanceStickinessControllerCore.ValidateBulkDispositionFindingIds(request!.FindingIds)
                .ToBadRequestProblemOrNull(this);

        if (findingIdsProblem is not null)
            return findingIdsProblem;

        IActionResult? dispositionValidation =
            GovernanceStickinessHttpMapper.ValidateBulkDisposition(request!).ToBadRequestProblemOrNull(this);

        if (dispositionValidation is not null)
            return dispositionValidation;

        (IActionResult? idempotencyError, _) = GovernanceIdempotencyKeySupport.ReadRequired(this);

        if (idempotencyError is not null)
            return idempotencyError;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        RecordBulkFindingDispositionResponse response;

        try
        {
            response = await _facade.RecordBulkDispositionAsync(request, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return Ok(response);
    }

    [HttpGet("findings/{findingId}/dispositions")]
    [ProducesResponseType(typeof(IReadOnlyList<FindingDispositionEventDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListDispositions(string findingId, CancellationToken cancellationToken = default)
    {
        IActionResult? findingIdProblem =
            GovernanceStickinessControllerCore.ValidateFindingId(findingId, out findingId)
                .ToBadRequestProblemOrNull(this);

        if (findingIdProblem is not null)
            return findingIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyList<FindingDispositionEventDto> history =
            await _facade.ListDispositionsAsync(findingId, cancellationToken);

        return Ok(history);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId:guid}/finding-merge-conflicts/{findingId}/resolve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: IGovernanceStickinessFacade.TryResolveFindingMergeConflictAsync logs FindingMergeConflictResolved.")]
    public async Task<IActionResult> ResolveFindingMergeConflict(
        [FromRoute] Guid runId,
        [FromRoute] string findingId,
        [FromBody] ArchLucid.Contracts.Findings.ResolveFindingMergeConflictRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? findingIdProblem =
            GovernanceStickinessControllerCore.ValidateFindingId(findingId, out findingId)
                .ToBadRequestProblemOrNull(this);

        if (findingIdProblem is not null)
            return findingIdProblem;

        IActionResult? runIdProblem =
            GovernanceStickinessControllerCore.ValidateRunId(runId).ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        IActionResult? actionValidation =
            GovernanceStickinessHttpMapper.ValidateResolveFindingMergeConflict(request!)
                .ToBadRequestProblemOrNull(this);

        if (actionValidation is not null)
            return actionValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            bool resolved = await _facade.TryResolveFindingMergeConflictAsync(
                runId,
                findingId,
                request!,
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
