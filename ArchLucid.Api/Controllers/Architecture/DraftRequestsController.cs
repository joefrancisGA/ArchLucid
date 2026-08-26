using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
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
public sealed partial class DraftRequestsController(
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

        DraftGetHangDiagnostics.Log(
            "controller_get_draft_entered",
            ("correlationId", HttpContext.TraceIdentifier),
            ("draftId", draftId),
            ("tenantId", scope.TenantId));

        long startedMs = Environment.TickCount64;
        DraftRequestResponse? draft = await _draftRequestService.GetAsync(scope, draftId, cancellationToken);

        DraftGetHangDiagnostics.Log(
            "controller_get_draft_completed",
            ("correlationId", HttpContext.TraceIdentifier),
            ("draftId", draftId),
            ("durationMs", Environment.TickCount64 - startedMs),
            ("found", draft is not null));

        if (draft is null)
            return this.NotFoundProblem($"Draft '{draftId}' was not found.", ProblemTypes.ValidationFailed);

        return Ok(draft);
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
