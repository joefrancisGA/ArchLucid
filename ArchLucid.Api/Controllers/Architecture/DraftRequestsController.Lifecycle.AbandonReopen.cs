using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Authorization;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Abandons a draft in <see cref="DraftRequestStatus.Drafting" /> or <see cref="DraftRequestStatus.Admitted" />.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/abandon")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AbandonDraft(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftRequestResponse? result = await _draftRequestService.AbandonAsync(scope, draftId, cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeAbandoned,
                    new { draftId, status = result.Status.ToString() }),
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (WorkOwnershipDeleteForbiddenException ex)
        {
            return this.ForbiddenProblemWithErrorCode(
                "Delete not permitted",
                ex.Message,
                ProblemErrorCodes.Forbidden);
        }
    }

    /// <summary>Returns an admitted draft to <see cref="DraftRequestStatus.Drafting" /> so the brief can be edited again.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/reopen")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReopenDraft(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftRequestResponse? result = await _draftRequestService.ReopenAsync(scope, draftId, cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeReopened,
                    new { draftId, status = result.Status.ToString() }),
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
