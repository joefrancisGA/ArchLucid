using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Downloads the ADR 0052 decision receipt JSON for a redirected intake draft.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{draftId:guid}/decision-receipt")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDraftDecisionReceipt(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DecisionReceiptDocument? receipt =
            await _decisionReceiptService.BuildForDraftAsync(scope, draftId, cancellationToken);

        if (receipt is null)
            return this.NotFoundProblem(
                $"Decision receipt for draft '{draftId}' was not found or is not exportable.",
                ProblemTypes.ValidationFailed);

        await _auditService.LogAsync(
            BuildDraftAuditEvent(
                scope,
                AuditEventTypes.DecisionReceiptExported,
                new { draftId, source = receipt.Source.ToString() }),
            cancellationToken);

        string json = JsonSerializer.Serialize(receipt, new JsonSerializerOptions { WriteIndented = true });
        byte[] body = System.Text.Encoding.UTF8.GetBytes(json);

        return File(body, "application/json", DecisionReceiptComposer.BuildFilename(receipt.DraftId, receipt.RunId));
    }

    /// <summary>Returns what-if branch quota and estimated run cost for an admitted parent draft (R12).</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{draftId:guid}/branch-quota")]
    [ProducesResponseType(typeof(DraftBranchQuotaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDraftBranchQuota(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftBranchQuotaResponse? quota =
                await _draftRequestService.GetBranchQuotaAsync(scope, draftId, cancellationToken);

            if (quota is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            return Ok(quota);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Clones an admitted or run-spawned draft with one ceteris-paribus override (R12).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/branch")]
    [ProducesResponseType(typeof(BranchDraftResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BranchDraft(
        Guid draftId,
        [FromBody] BranchDraftRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorUserId = _actorContext.GetActorId();

        try
        {
            BranchDraftResponse? result = await _draftRequestService.BranchAsync(
                scope,
                draftId,
                actorUserId,
                body,
                cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeBranched,
                    new
                    {
                        parentDraftId = draftId,
                        branchDraftId = result.Branch.DraftId,
                        overrideKind = body.OverrideKind.ToString(),
                    }),
                cancellationToken);

            return CreatedAtAction(nameof(GetDraft), new { draftId = result.Branch.DraftId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

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
    public async Task<IActionResult> SubmitDraft(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            SubmitDraftResponse? result = await _draftRequestService.SubmitAsync(scope, draftId, cancellationToken);

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
