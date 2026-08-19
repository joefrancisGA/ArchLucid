using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models.Alerts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Alerts;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>
///     Lists alerts and applies lifecycle actions (acknowledge / resolve / suppress) for the caller’s
///     tenant/workspace/project scope.
/// </summary>
/// <remarks>
///     Scope comes from <see cref="IScopeContextProvider" />; alert <strong>evaluation</strong> is performed by
///     orchestration paths
///     (<c>AlertService</c> / composite service), not from this controller. Outbound delivery filters are configured on
///     <c>POST /v1/alert-routing-subscriptions</c> (<see cref="AlertRoutingSubscriptionsController" />).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/alerts")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class AlertsController(
    IScopeContextProvider scopeProvider,
    IAlertRecordRepository alertRepository,
    IAlertRuleRepository alertRuleRepository,
    IAuthorityQueryService authorityQueryService,
    IAlertService alertService,
    IAlertActionLoopReader actionLoopReader,
    IAuditService auditService)
    : ControllerBase
{
    private readonly IAlertRuleRepository _alertRuleRepository =
        alertRuleRepository ?? throw new ArgumentNullException(nameof(alertRuleRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IAlertActionLoopReader _actionLoopReader =
        actionLoopReader ?? throw new ArgumentNullException(nameof(actionLoopReader));

    /// <summary>
    ///     Inbox summary card aggregates for the current scope (TB-2023) — replaces N× page-size-1 list calls.
    /// </summary>
    [HttpGet("inbox-summary")]
    [ProducesResponseType(typeof(AlertsInboxSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetInboxSummary(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertsInboxSummaryDto summary = await alertRepository.GetInboxSummaryByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        string fingerprint =
            $"inbox-summary|tenant={scope.TenantId}|workspace={scope.WorkspaceId}|project={scope.ProjectId}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            summary,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(summary, etag);
    }

    /// <summary>Workspace readiness signals for alerts inbox empty states (rules + reviews presence).</summary>
    [HttpGet("inbox/workspace-context")]
    [ProducesResponseType(typeof(AlertsInboxWorkspaceContextResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInboxWorkspaceContext(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        Task<IReadOnlyList<AlertRule>> rulesTask = _alertRuleRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> runsTask =
            _authorityQueryService.ListRunsByProjectKeysetAsync(
                scope,
                "default",
                cursorCreatedUtc: null,
                cursorRunId: null,
                take: 1,
                cancellationToken);

        await Task.WhenAll(rulesTask, runsTask).ConfigureAwait(false);

        IReadOnlyList<AlertRule> rules = await rulesTask.ConfigureAwait(false);
        (IReadOnlyList<RunSummaryDto> runItems, bool hasMoreRuns) =
            await runsTask.ConfigureAwait(false);

        AlertsInboxWorkspaceContextResponse body = new()
        {
            HasAlertRules = rules.Count > 0,
            HasReviews = runItems.Count > 0 || hasMoreRuns,
        };

        return Ok(body);
    }

    /// <summary>Lists recent alerts for the current scope, optionally filtered by status.</summary>
    /// <param name="status">When set, restricts to alerts with this status string (repository-defined).</param>
    /// <param name="take">Max rows (capped by repository). Used when <paramref name="page" /> is not set.</param>
    /// <param name="page">One-based page number. When provided, the response is a <see cref="PagedResponse{T}" />.</param>
    /// <param name="pageSize">Items per page (clamped 1–200; default 50). Only used when <paramref name="page" /> is set.</param>
    /// <param name="cursor">
    ///     Opaque keyset token (<c>utcTicks:alertId</c>). When present (including empty for the first page), the response is
    ///     a <see cref="CursorPagedResponse{T}" />; otherwise OFFSET <paramref name="page" /> / total is used.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AlertRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PagedResponse<AlertRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CursorPagedResponse<AlertRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] string? status = null,
        [FromQuery] int take = 100,
        [FromQuery] int? page = null,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        [FromQuery] bool includeArchived = false,
        [FromQuery] string? cursor = null,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (Request.Query.ContainsKey("cursor"))
        {
            if (!ApiPaging.TryParseUtcTicksIdCursor(cursor, out DateTime? cursorCreatedUtc, out string? cursorId,
                    out string? cursorError))
                return this.BadRequestProblem(cursorError!, ProblemTypes.ValidationFailed);

            Guid? cursorAlertId = null;

            if (!string.IsNullOrWhiteSpace(cursorId))
            {
                if (!Guid.TryParse(cursorId, out Guid parsedAlertId))
                    return this.BadRequestProblem(
                        "cursor alert id must be a GUID.",
                        ProblemTypes.ValidationFailed);

                cursorAlertId = parsedAlertId;
            }

            int safeTake = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
            (IReadOnlyList<AlertRecord> keysetItems, bool hasMore) = await alertRepository.ListByScopeKeysetAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                status,
                cursorCreatedUtc,
                cursorAlertId,
                safeTake,
                includeArchived,
                ct);

            string? nextCursor = hasMore && keysetItems.Count > 0
                ? $"{keysetItems[^1].CreatedUtc.Ticks}:{keysetItems[^1].AlertId}"
                : null;

            return Ok(
                new CursorPagedResponse<AlertRecord>
                {
                    Items = keysetItems,
                    NextCursor = nextCursor,
                    HasMore = hasMore,
                    RequestedTake = safeTake,
                });
        }

        if (page.HasValue)
        {
            (int safePage, int safePageSize) = PaginationDefaults.Normalize(page.Value, pageSize);
            int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
            (IReadOnlyList<AlertRecord> items, int total) = await alertRepository.ListByScopePagedAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                status,
                skip,
                safePageSize,
                includeArchived,
                ct);

            return Ok(PagedResponseBuilder.FromDatabasePage(items, total, safePage, safePageSize));
        }

        take = Math.Clamp(take, 1, PaginationDefaults.MaxListingTake);

        IReadOnlyList<AlertRecord> alerts = await alertRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            status,
            take,
            includeArchived,
            ct);

        return Ok(PagedResponseBuilder.FromDatabasePage(alerts, alerts.Count, 1, take));
    }

    /// <summary>Archives an alert in the current scope (hidden from default listings).</summary>
    [HttpPatch("{alertId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(
        Guid alertId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);

        if (existing is null || !MatchesScope(existing, scope))
            return this.NotFoundProblem(
                $"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        if (existing.IsArchived)
            return Ok(existing);

        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        await alertRepository.ArchiveAsync(alertId, ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertArchived,
                RunId = existing.RunId,
                ActorUserId = userId,
                ActorUserName = userName,
                DataJson = JsonSerializer.Serialize(new { alertId }),
            },
            ct);

        AlertRecord? updated = await alertRepository.GetByIdAsync(alertId, ct);

        return Ok(updated ?? existing);
    }

    /// <summary>Alert lifecycle plus redacted delivery attempts for closure visibility.</summary>
    [HttpGet("{alertId:guid}/action-loop")]
    [ProducesResponseType(typeof(AlertActionLoopResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActionLoop(Guid alertId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertActionLoopSnapshot? snapshot =
            await _actionLoopReader.GetAsync(alertId, scope, ct).ConfigureAwait(false);

        if (snapshot is null)
            return this.NotFoundProblem($"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        AlertActionLoopResponse body = new()
        {
            AlertId = snapshot.AlertId,
            Status = snapshot.Status,
            RunId = snapshot.RunId,
            LastUpdatedUtc = snapshot.LastUpdatedUtc,
            ResolutionComment = snapshot.ResolutionComment,
            DeliveryAttempts = snapshot.DeliveryAttempts
                .Select(static a => new AlertDeliveryAttemptResponse
                {
                    ChannelType = a.ChannelType,
                    Status = a.Status,
                    AttemptedUtc = a.AttemptedUtc,
                    DestinationRedacted = a.DestinationRedacted,
                    ErrorMessage = a.ErrorMessage,
                })
                .ToList(),
        };

        return Ok(body);
    }

    /// <summary>Applies an operator action to an alert if it belongs to the current scope.</summary>
    /// <param name="alertId">Target alert id.</param>
    /// <param name="request">Action type and optional comment.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Updated alert, or 404 when missing or out of scope.</returns>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{alertId:guid}/action")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplyAction(
        Guid alertId,
        [FromBody] AlertActionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);
        if (existing is null || !MatchesScope(existing, scope))
            return this.NotFoundProblem(
                $"Alert '{alertId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        AlertRecord? updated = await alertService.ApplyActionAsync(
            alertId,
            userId,
            userName,
            request,
            ct);

        if (updated is null)
            return this.NotFoundProblem(
                $"Alert '{alertId}' could not be updated.",
                ProblemTypes.ResourceNotFound);

        return Ok(updated);
    }

    /// <summary>Acknowledges many alerts in the current scope; each id is processed independently (partial success).</summary>
    [HttpPost("acknowledge-batch")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertsAcknowledgeBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcknowledgeBatch(
        [FromBody] AlertsAcknowledgeBatchRequest? body,
        CancellationToken ct = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.AlertIds.Count == 0)
            return this.BadRequestProblem("AlertIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (body.AlertIds.Count > 100)
            return this.BadRequestProblem("At most 100 alert ids are allowed per request.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";

        AlertActionRequest action = new() { Action = AlertActionType.Acknowledge, Comment = body.Comment };

        List<AlertsAcknowledgeBatchItemResult> results = [];
        HashSet<Guid> seen = [];

        foreach (Guid alertId in body.AlertIds)
        {
            if (!seen.Add(alertId))
                continue;

            AlertRecord? existing = await alertRepository.GetByIdAsync(alertId, ct);

            if (existing is null || !MatchesScope(existing, scope))
            {
                results.Add(
                    new AlertsAcknowledgeBatchItemResult
                    {
                        AlertId = alertId, Succeeded = false, Message = "Alert not found in the current scope."
                    });
                continue;
            }

            AlertRecord? updated = await alertService.ApplyActionAsync(alertId, userId, userName, action, ct);

            if (updated is null)
            {
                results.Add(
                    new AlertsAcknowledgeBatchItemResult
                    {
                        AlertId = alertId, Succeeded = false, Message = "Alert could not be acknowledged."
                    });
                continue;
            }

            results.Add(
                new AlertsAcknowledgeBatchItemResult { AlertId = alertId, Succeeded = true });
        }

        return Ok(new AlertsAcknowledgeBatchResponse { Results = results });
    }

    private static bool MatchesScope(AlertRecord alert, ScopeContext scope)
    {
        return alert.TenantId == scope.TenantId &&
               alert.WorkspaceId == scope.WorkspaceId &&
               alert.ProjectId == scope.ProjectId;
    }
}
