using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Clones a run-spawned draft into a new editable architecture id (WA-10).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/clone-snapshot")]
    [ProducesResponseType(typeof(CloneSnapshotDraftResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloneDraftSnapshot(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorUserId = _actorContext.GetActorId();

        try
        {
            CloneSnapshotDraftResponse? result = await _draftRequestService.CloneSnapshotAsync(
                scope,
                draftId,
                actorUserId,
                cancellationToken);

            if (result is null)
            {
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);
            }

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeSnapshotCloned,
                    new
                    {
                        sourceDraftId = draftId,
                        cloneDraftId = result.Clone.DraftId,
                    }),
                cancellationToken);

            return CreatedAtAction(nameof(GetDraft), new { draftId = result.Clone.DraftId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
