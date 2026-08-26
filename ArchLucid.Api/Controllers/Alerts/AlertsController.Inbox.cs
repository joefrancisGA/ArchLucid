using ArchLucid.Api.Http;
using ArchLucid.Api.Models.Alerts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertsController
{
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
}
