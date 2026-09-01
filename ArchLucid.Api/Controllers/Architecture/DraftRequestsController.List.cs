using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Lists architecture intake drafts created by the signed-in operator in the current workspace.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<DraftRequestSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListDrafts(
        [FromQuery] bool mine = true,
        [FromQuery] string? status = null,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (!mine)
        {
            return this.BadRequestProblem(
                "Only mine=true is supported for draft inventory in v1.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorUserId = _actorContext.GetActorId();

        IReadOnlyList<DraftRequestStatus> statuses;

        try
        {
            statuses = DraftRequestListStatusFilter.ParseOrDefault(status);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        PagedResponse<DraftRequestSummaryResponse> response = await _draftRequestService.ListAsync(
            scope,
            actorUserId,
            statuses,
            page,
            pageSize,
            cancellationToken);

        return Ok(response);
    }
}
