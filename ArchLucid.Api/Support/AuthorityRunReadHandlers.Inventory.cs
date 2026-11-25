using System.Security.Claims;

using ArchLucid.Api.Contracts;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Api.Support;

public sealed partial class AuthorityRunReadHandlers
{
    private const int InventorySealWindow = 50;

    public async Task<CursorPagedResponse<RunSummaryResponse>> ReadInventoryAsync(
        ClaimsPrincipal user,
        ScopeContext scope,
        string? projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        // Reuse decisions when the seal scan and requested page overlap, within this request only.
        Dictionary<Guid, bool> visibility = [];

        async Task<bool> CanReadAsync(Guid runId, CancellationToken cancellationToken)
        {
            if (visibility.TryGetValue(runId, out bool canRead))
                return canRead;

            (bool found, bool allowed) = await architectureShareAccessGate
                .EvaluateRunReadAsync(user, scope, runId, cancellationToken);
            canRead = found && allowed;

            if (visibility.Count < RunPagination.MaxTake)
                visibility.Add(runId, canRead);

            return canRead;
        }

        await RunInventorySealedManifestReadGuard.EnsureVisibleRunInventoryReadAllowedOrThrowAsync(
            inventoryQuery.EnumerateVisibleHeadersAsync(scope, null, null, null, CanReadAsync, ct),
            InventorySealWindow,
            scope,
            queryService,
            _manifestHashService,
            ct);

        int pageSize = RunPagination.ClampTake(take);
        RunListPage page = await AuthorityRunInventoryQuery.PageVisibleHeadersAsync(
            inventoryQuery.EnumerateVisibleHeadersAsync(scope, projectId, cursorCreatedUtc, cursorRunId, CanReadAsync, ct),
            offset: 0,
            pageSize,
            ct);

        IReadOnlyList<RunSummaryDto> summaries = await inventoryQuery.ProjectSummariesAsync(scope, page.Items, ct);
        return new CursorPagedResponse<RunSummaryResponse>
        {
            Items = summaries.Select(ToRunSummaryResponse).ToList(),
            HasMore = page.HasMore,
            NextCursor = page.HasMore ? RunCursorCodec.Encode(page.Items[^1].CreatedUtc, page.Items[^1].RunId) : null,
            RequestedTake = pageSize,
        };
    }
}
