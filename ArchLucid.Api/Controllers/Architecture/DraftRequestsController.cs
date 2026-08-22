using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Architecture;

/// <summary>Mutable Socratic intake drafts in front of the canonical run-create surface (ADR 0048).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/draft")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class DraftRequestsController(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IDraftRequestService draftRequestService,
    IDraftIntakeReasoningService draftIntakeReasoningService,
    IDecisionReceiptService decisionReceiptService,
    IAuditService auditService) : ControllerBase
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IDraftRequestService _draftRequestService =
        draftRequestService ?? throw new ArgumentNullException(nameof(draftRequestService));

    private readonly IDraftIntakeReasoningService _draftIntakeReasoningService =
        draftIntakeReasoningService ?? throw new ArgumentNullException(nameof(draftIntakeReasoningService));

    private readonly IDecisionReceiptService _decisionReceiptService =
        decisionReceiptService ?? throw new ArgumentNullException(nameof(decisionReceiptService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Creates a new draft in <see cref="DraftRequestStatus.Drafting" />.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDraft([FromBody] CreateDraftRequest? body, CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorUserId = _actorContext.GetActorId();

        try
        {
            DraftRequestResponse created =
                await _draftRequestService.CreateAsync(scope, actorUserId, body, cancellationToken);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeCreated,
                    new { draftId = created.DraftId, status = created.Status.ToString() }),
                cancellationToken);

            return CreatedAtAction(nameof(GetDraft), new { draftId = created.DraftId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Gets a draft by id within the current scope.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{draftId:guid}")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDraft(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DraftRequestResponse? draft = await _draftRequestService.GetAsync(scope, draftId, cancellationToken);

        if (draft is null)
            return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

        return Ok(draft);
    }

    /// <summary>Returns the deterministic L0/L1 question set for the draft (ADR 0051).</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{draftId:guid}/questions")]
    [ProducesResponseType(typeof(DraftQuestionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDraftQuestions(Guid draftId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftQuestionsResponse? result =
                await _draftRequestService.GetQuestionsAsync(scope, draftId, cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Patches a draft while <see cref="DraftRequestStatus.Drafting" />.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPatch("{draftId:guid}")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PatchDraft(
        Guid draftId,
        [FromBody] PatchDraftRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftRequestResponse? updated =
                await _draftRequestService.PatchAsync(scope, draftId, body, cancellationToken);

            if (updated is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakePatched,
                    new { draftId, status = updated.Status.ToString() }),
                cancellationToken);

            return Ok(updated);
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

    /// <summary>Records an answer to an elicitation question on the draft.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/answer")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnswerQuestion(
        Guid draftId,
        [FromBody] AnswerDraftQuestionRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftRequestResponse? updated =
                await _draftRequestService.AnswerQuestionAsync(scope, draftId, body, cancellationToken);

            if (updated is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeQuestionAnswered,
                    new { draftId, questionKey = body.QuestionKey.Trim() }),
                cancellationToken);

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

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

    /// <summary>Pre-run manifest-free reasoning turn on the draft (SAQ-013).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/reason")]
    [ProducesResponseType(typeof(DraftIntakeReasonResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReasonDraft(
        Guid draftId,
        [FromBody] DraftIntakeReasonRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftIntakeReasonResponse? result = await _draftIntakeReasoningService.ReasonAsync(
                draftId,
                body,
                scope,
                cancellationToken);

            if (result is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeReasoned,
                    new { draftId, conversationThreadId = result.ConversationThreadId }),
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Explicitly skips an elicitation question, recording it in the transparency trail (ADR 0050).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{draftId:guid}/skip")]
    [ProducesResponseType(typeof(DraftRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SkipQuestion(
        Guid draftId,
        [FromBody] SkipDraftQuestionRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DraftRequestResponse? updated =
                await _draftRequestService.SkipQuestionAsync(scope, draftId, body, cancellationToken);

            if (updated is null)
                return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

            await _auditService.LogAsync(
                BuildDraftAuditEvent(
                    scope,
                    AuditEventTypes.DraftIntakeQuestionSkipped,
                    new { draftId, questionKey = body.QuestionKey.Trim() }),
                cancellationToken);

            return Ok(updated);
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

    private AuditEvent BuildDraftAuditEvent(ScopeContext scope, string eventType, object payload)
    {
        string actor = _actorContext.GetActor();

        return new AuditEvent
        {
            EventType = eventType,
            ActorUserId = _actorContext.GetActorId(),
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(payload),
        };
    }
}
