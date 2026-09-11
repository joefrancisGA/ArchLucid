using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Acquires a soft exclusive work lease on a drafting intake desk (ADR 0090).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPost("{draftId:guid}/work-lease/acquire")]
    [ProducesResponseType(typeof(ArchitectureWorkLeaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ArchitectureWorkLeaseConflictResponse), StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: work-lease acquire logs DraftIntake.WorkLeaseAcquired via LogOrThrowAsync.")]
    public async Task<IActionResult> AcquireDraftWorkLease(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        ArchitectureWorkLeaseAcquireResult result = await _architectureWorkLeaseService.AcquireAsync(
            scope,
            draftId,
            actorId,
            cancellationToken);

        if (result.Status == ArchitectureWorkLeaseAcquireStatus.DraftNotFound
            || result.Status == ArchitectureWorkLeaseAcquireStatus.HolderNotResolved)
        {
            return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureWorkLeaseAcquireStatus.HeldByOther)
        {
            return Conflict(result.Conflict);
        }

        await _auditService.LogAsync(
            BuildDraftAuditEvent(
                scope,
                AuditEventTypes.ArchitectureWorkLeaseAcquired,
                new
                {
                    draftId,
                    architectureId = result.Response?.ArchitectureId,
                    holderUserId = result.Response?.HolderUserId,
                }),
            cancellationToken);

        return Ok(result.Response);
    }

    /// <summary>Extends the caller's unexpired work lease TTL.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPost("{draftId:guid}/work-lease/heartbeat")]
    [ProducesResponseType(typeof(ArchitectureWorkLeaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Heartbeat extends lease TTL only; acquire is audited (LW-090).")]
    public async Task<IActionResult> HeartbeatDraftWorkLease(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        ArchitectureWorkLeaseHeartbeatResult result = await _architectureWorkLeaseService.HeartbeatAsync(
            scope,
            draftId,
            actorId,
            cancellationToken);

        if (result.Status is ArchitectureWorkLeaseHeartbeatStatus.DraftNotFound
            or ArchitectureWorkLeaseHeartbeatStatus.HolderNotResolved
            or ArchitectureWorkLeaseHeartbeatStatus.LeaseNotFound)
        {
            return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ResourceNotFound);
        }

        if (result.Status is ArchitectureWorkLeaseHeartbeatStatus.NotHolder
            or ArchitectureWorkLeaseHeartbeatStatus.Expired)
        {
            return this.ConflictProblem(
                "Work lease is not held by the caller or has expired.",
                ProblemTypes.Conflict);
        }

        return Ok(result.Response);
    }

    /// <summary>Releases the caller's work lease on a draft (best-effort on workspace unmount).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{draftId:guid}/work-lease")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Best-effort release on workspace unmount; no durable audit required (LW-090).")]
    public async Task<IActionResult> ReleaseDraftWorkLease(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        ArchitectureWorkLeaseReleaseResult result = await _architectureWorkLeaseService.ReleaseAsync(
            scope,
            draftId,
            actorId,
            cancellationToken);

        if (result.Status is ArchitectureWorkLeaseReleaseStatus.DraftNotFound
            or ArchitectureWorkLeaseReleaseStatus.HolderNotResolved
            or ArchitectureWorkLeaseReleaseStatus.LeaseNotFound
            or ArchitectureWorkLeaseReleaseStatus.NotHolder)
        {
            return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ResourceNotFound);
        }

        return NoContent();
    }
}
