using ArchLucid.Api.Models.Drafts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Runs the semantic admission gate (redirect-not-refuse).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/admit")]
    [ProducesResponseType(typeof(DraftAdmissionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdmitDraft(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftAdmissionResponse? result =
                await _draftRequestService.RequestAdmissionAsync(scope, draftId, cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeAdmissionEvaluated,
                    new
                    {
                        draftId,
                        admitted = result.Admitted,
                        status = result.Status.ToString(),
                        hasRedirectReason = !string.IsNullOrWhiteSpace(result.RedirectReason),
                    }),
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Submits an admitted draft to the canonical <c>POST /v1/architecture/request</c> path.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/submit")]
    [ProducesResponseType(typeof(SubmitDraftResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitDraft(
        Guid draftId,
        [FromBody] SubmitDraftPostRequest? body,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            SubmitDraftResponse? result = await _draftRequestService.SubmitAsync(
                scope,
                draftId,
                body?.ExpectedUpdatedUtc,
                cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeSubmitted,
                    new
                    {
                        draftId,
                        status = result.Status.ToString(),
                        runId = result.RunId,
                        requestId = result.RequestId,
                    }),
                cancellationToken);

            return Ok(result);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
