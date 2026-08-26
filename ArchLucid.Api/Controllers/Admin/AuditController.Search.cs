using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Http;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    /// <remarks>
    ///     Returns newest-first audit events capped by <paramref name="take" />; pass <paramref name="cursor" /> from
    ///     <see cref="CursorPagedResponse{T}.NextCursor" /> for the next page.
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(CursorPagedResponse<AuditEvent>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetAudit(
        [FromQuery] string? cursor = null,
        [FromQuery] int take = 100,
        CancellationToken ct = default)
    {
        int clampedTake = Math.Clamp(take, 1, PaginationDefaults.MaxListingTake);
        ScopeContext scope = scopeProvider.GetCurrentScope();

        (DateTime OccurredUtc, Guid EventId)? cursorPair = AuditEventCursorCodec.TryDecode(cursor);

        if (!string.IsNullOrWhiteSpace(cursor) && cursorPair is null)
            return this.BadRequestProblem("cursor is invalid.", ProblemTypes.ValidationFailed);

        AuditEventFilter filter = new()
        {
            Take = clampedTake + 1, BeforeUtc = cursorPair?.OccurredUtc, BeforeEventId = cursorPair?.EventId
        };

        IReadOnlyList<AuditEvent> rows =
            await repo.GetFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, filter, ct);

        CursorPagedResponse<AuditEvent> page = ToCursorPage(rows, clampedTake);
        string fingerprint = $"audit|take={clampedTake}|cursor={cursor}";
        string etag = ConditionalGetNegotiation.ComputeAuditPageEtag(page.Items, fingerprint);

        return this.OkWithConditionalEtag(page, etag);
    }

    /// <summary>Filtered audit query within the current tenant/workspace/project scope.</summary>
    /// <param name="cursor">
    ///     Opaque keyset token from <see cref="CursorPagedResponse{T}.NextCursor" />; supersedes bare
    ///     <paramref name="beforeUtc" /> / <paramref name="beforeEventId" /> when both are present.
    /// </param>
    /// <param name="beforeUtc">Keyset cursor: only events at or before this instant per ordering (ISO-8601).</param>
    /// <param name="beforeEventId">
    ///     Optional tie-break when multiple events share the same <paramref name="beforeUtc" /> — pass the previous page’s
    ///     last <c>EventId</c> with the same <paramref name="beforeUtc" /> for stable pagination.
    /// </param>
    [HttpGet("search")]
    [ProducesResponseType(typeof(CursorPagedResponse<AuditEvent>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> SearchAudit(
        [FromQuery] string? cursor = null,
        [FromQuery] string? eventType = null,
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] DateTime? beforeUtc = null,
        [FromQuery] Guid? beforeEventId = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] string? actorUserId = null,
        [FromQuery] Guid? runId = null,
        [FromQuery] int take = 100,
        [FromQuery] bool includeDataJson = false,
        CancellationToken ct = default)
    {
        (DateTime OccurredUtc, Guid EventId)? opaque = AuditEventCursorCodec.TryDecode(cursor);

        if (!string.IsNullOrWhiteSpace(cursor) && opaque is null)
            return this.BadRequestProblem("cursor is invalid.", ProblemTypes.ValidationFailed);

        if (beforeEventId.HasValue && !beforeUtc.HasValue && opaque is null)
        {
            return this.BadRequestProblem(
                "beforeEventId requires beforeUtc for stable keyset pagination.",
                ProblemTypes.ValidationFailed);
        }

        if (beforeUtc.HasValue && !beforeEventId.HasValue && opaque is null)
        {
            return this.BadRequestProblem(
                "beforeUtc requires beforeEventId for stable keyset pagination.",
                ProblemTypes.ValidationFailed);
        }

        int clampedTake = Math.Clamp(take, 1, PaginationDefaults.MaxListingTake);
        ScopeContext scope = scopeProvider.GetCurrentScope();

        DateTime? effectiveBeforeUtc = opaque?.OccurredUtc ?? beforeUtc;
        Guid? effectiveBeforeEventId = opaque?.EventId ?? beforeEventId;

        AuditEventFilter filter = new()
        {
            EventType = eventType,
            FromUtc = fromUtc,
            ToUtc = toUtc,
            BeforeUtc = effectiveBeforeUtc,
            BeforeEventId = effectiveBeforeEventId,
            CorrelationId = correlationId,
            ActorUserId = actorUserId,
            RunId = runId,
            Take = clampedTake + 1,
            IncludeDataJson = includeDataJson,
        };

        IReadOnlyList<AuditEvent> rows = await repo.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            ct);

        CursorPagedResponse<AuditEvent> page = ToCursorPage(rows, clampedTake);
        string fingerprint =
            $"audit-search|take={clampedTake}|cursor={cursor}|eventType={eventType}|from={fromUtc:O}|to={toUtc:O}|before={effectiveBeforeUtc:O}|beforeId={effectiveBeforeEventId}|corr={correlationId}|actor={actorUserId}|run={runId}|data={includeDataJson}";
        string etag = ConditionalGetNegotiation.ComputeAuditPageEtag(page.Items, fingerprint);

        return this.OkWithConditionalEtag(page, etag);
    }

    private static CursorPagedResponse<AuditEvent> ToCursorPage(IReadOnlyList<AuditEvent> rows, int clampedTake)
    {
        List<AuditEvent> materialized = rows.ToList();
        bool hasMore = materialized.Count > clampedTake;

        if (hasMore)

            materialized.RemoveAt(materialized.Count - 1);

        string? nextCursor = hasMore && materialized.Count > 0
            ? AuditEventCursorCodec.Encode(materialized[^1].OccurredUtc, materialized[^1].EventId)
            : null;

        return new CursorPagedResponse<AuditEvent>
        {
            Items = materialized, NextCursor = nextCursor, HasMore = hasMore, RequestedTake = clampedTake
        };
    }
}
