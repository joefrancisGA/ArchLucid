using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityQueryController
{
    /// <summary>
    ///     Lists runs for an authority project slug (e.g. <c>default</c>). Prefer <paramref name="cursor" /> +
    ///     <paramref name="take" /> (stable keyset). Legacy <paramref name="page" />/<paramref name="pageSize" /> is kept
    ///     only for page 1.
    /// </summary>
    /// <param name="projectId">Path segment: authority project id/slug, not the scope GUID.</param>
    /// <param name="cursor">Opaque next-cursor token from the previous response.</param>
    /// <param name="take">Max rows when using cursor mode (default per <see cref="RunPagination.DefaultTake" />).</param>
    /// <param name="page">
    ///     Legacy only: must be <c>1</c>. Page <c>&gt;</c><c>1</c> requires passing <paramref name="cursor" />.
    /// </param>
    /// <param name="pageSize">
    ///     Legacy page size when <paramref name="page" /> is set (ignored when <paramref name="cursor" /> is supplied).
    /// </param>
    /// <param name="ct"></param>
    /// <returns>Newest-first <see cref="CursorPagedResponse{T}" /> of <see cref="RunSummaryResponse" />.</returns>
    [HttpGet("projects/{projectId}/reviews")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListRunsByProject(
        string projectId,
        [FromQuery] string? cursor = null,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int? page = null,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(projectId))
            return this.BadRequestProblem("projectId is required.", ProblemTypes.BadRequest);

        if (page is > 1 && string.IsNullOrWhiteSpace(cursor))
            return this.BadRequestProblem(
                "Paging beyond page 1 requires the nextCursor token from the prior response.",
                ProblemTypes.BadRequest);

        DateTime? cu = null;
        Guid? rid = null;

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor.Trim());

            if (!decoded.HasValue)
                return this.BadRequestProblem("cursor is invalid.", ProblemTypes.ValidationFailed);

            cu = decoded.Value.CreatedUtc;

            rid = decoded.Value.RunId;
        }

        int effectiveTake =
            string.IsNullOrWhiteSpace(cursor) && page.HasValue
                ? RunPagination.ClampTake(pageSize)
                : RunPagination.ClampTake(take);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        (IReadOnlyList<RunSummaryDto> Items, bool HasMore) keysetPage =
            await queryService.ListRunsByProjectKeysetAsync(scope, projectId, cu, rid, effectiveTake, ct);

        string? nextCursor =
            keysetPage is { HasMore: true, Items.Count: > 0 }
                ? RunCursorCodec.Encode(keysetPage.Items[^1].CreatedUtc, keysetPage.Items[^1].RunId)
                : null;

        IReadOnlyList<RunSummaryResponse> mapped = keysetPage.Items.Select(AuthorityRunReadHandlers.ToRunSummaryResponse).ToList();

        return Ok(
            new CursorPagedResponse<RunSummaryResponse>
            {
                Items = mapped, NextCursor = nextCursor, HasMore = keysetPage.HasMore, RequestedTake = effectiveTake
            });
    }

    /// <summary>
    ///     Lists runs across all authority project slugs in the current tenant/workspace/project scope (newest first).
    ///     Prefer <c>GET /v1/runs</c> (<see cref="AuthorityReadsController.ListRuns" />).
    /// </summary>
    [Obsolete("Prefer GET /v1/runs. Retained for backward compatibility.")]
    [HttpGet("reviews")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListRunsInScope(
        [FromQuery] string? cursor = null,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int? page = null,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken ct = default)
    {
        if (page is > 1 && string.IsNullOrWhiteSpace(cursor))
            return this.BadRequestProblem(
                "Paging beyond page 1 requires the nextCursor token from the prior response.",
                ProblemTypes.ValidationFailed);

        DateTime? cu = null;
        Guid? rid = null;

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor.Trim());

            if (!decoded.HasValue)
                return this.BadRequestProblem("cursor is invalid.", ProblemTypes.ValidationFailed);

            cu = decoded.Value.CreatedUtc;

            rid = decoded.Value.RunId;
        }

        int effectiveTake =
            string.IsNullOrWhiteSpace(cursor) && page.HasValue
                ? RunPagination.ClampTake(pageSize)
                : RunPagination.ClampTake(take);

        (IReadOnlyList<RunSummaryDto> Items, bool HasMore) keysetPage =
            await readHandlers.ListRunsInScopeKeysetAsync(cu, rid, effectiveTake, ct);

        string? nextCursor =
            keysetPage is { HasMore: true, Items.Count: > 0 }
                ? RunCursorCodec.Encode(keysetPage.Items[^1].CreatedUtc, keysetPage.Items[^1].RunId)
                : null;

        IReadOnlyList<RunSummaryResponse> mapped = keysetPage.Items.Select(AuthorityRunReadHandlers.ToRunSummaryResponse).ToList();

        return Ok(
            new CursorPagedResponse<RunSummaryResponse>
            {
                Items = mapped, NextCursor = nextCursor, HasMore = keysetPage.HasMore, RequestedTake = effectiveTake
            });
    }
}
