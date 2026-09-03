using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Persistence.Data.Repositories;

internal static partial class DraftRequestRepositoryCore
{
    public static IReadOnlyList<DraftRequestResponse> ListRunSpawnedInScope(
        IEnumerable<InMemoryDraftRequestStoredDraft> drafts,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid excludeDraftId,
        int maxCount,
        Func<InMemoryDraftRequestStoredDraft, DraftRequestResponse> map)
    {
        ArgumentNullException.ThrowIfNull(drafts);
        ArgumentNullException.ThrowIfNull(map);

        int effectiveMax = ClampPriorDraftsMaxCount(maxCount);

        return drafts
            .Where(stored =>
                MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId)
                && MatchesRunSpawnedInScope(
                    stored.Status,
                    stored.DraftId,
                    excludeDraftId))
            .OrderByDescending(stored => stored.UpdatedUtc)
            .Take(effectiveMax)
            .Select(map)
            .ToList();
    }

    public static (IReadOnlyList<DraftRequestResponse> PageItems, int TotalCount) ListForCreatorInWorkspace(
        IEnumerable<InMemoryDraftRequestStoredDraft> drafts,
        Guid tenantId,
        Guid workspaceId,
        string createdByUserId,
        IReadOnlyList<DraftRequestStatus> statuses,
        int page,
        int pageSize,
        Func<InMemoryDraftRequestStoredDraft, DraftRequestResponse> map)
    {
        ArgumentNullException.ThrowIfNull(drafts);
        ArgumentNullException.ThrowIfNull(map);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);
        ValidateStatusFilter(statuses);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        HashSet<DraftRequestStatus> statusFilter = statuses.ToHashSet();

        List<DraftRequestResponse> matches = drafts
            .Where(stored =>
                stored.TenantId == tenantId
                && stored.WorkspaceId == workspaceId
                && MatchesCreatorInWorkspace(
                    stored.CreatedByUserId,
                    stored.Status,
                    createdByUserId,
                    statusFilter))
            .OrderByDescending(stored => stored.UpdatedUtc)
            .Select(map)
            .ToList();

        IReadOnlyList<DraftRequestResponse> pageItems = matches.Skip(skip).Take(safePageSize).ToList();

        return (pageItems, matches.Count);
    }

    public static InMemoryDraftRequestStoredDraft? FindBySpawnedRunId(
        IEnumerable<InMemoryDraftRequestStoredDraft> drafts,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string spawnedRunId)
    {
        ArgumentNullException.ThrowIfNull(drafts);
        ArgumentException.ThrowIfNullOrWhiteSpace(spawnedRunId);

        return drafts.FirstOrDefault(stored =>
            MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId)
            && MatchesSpawnedRunId(stored.SpawnedRunId, spawnedRunId));
    }
}
