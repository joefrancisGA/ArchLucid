using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.DraftRequests</c> for tenant-scoped Socratic intake drafts (ADR 0048).</summary>
public interface IDraftRequestRepository
{
    Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Hard-deletes up to <paramref name="batchSize" /> terminal drafts
    ///     (<see cref="DraftRequestStatus.Redirected" /> / <see cref="DraftRequestStatus.Abandoned" />)
    ///     with <c>UpdatedUtc</c> before <paramref name="updatedBeforeUtc" />.
    /// </summary>
    Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken);

    /// <summary>Counts drafts whose document <c>parentDraftId</c> matches <paramref name="parentDraftId" />.</summary>
    Task<int> CountChildBranchesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid parentDraftId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Lists run-spawned drafts in scope (newest first) for repeat-pilot answer reuse.
    ///     Excludes <paramref name="excludeDraftId" /> when non-empty.
    /// </summary>
    Task<IReadOnlyList<DraftRequestResponse>> ListRunSpawnedInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid excludeDraftId,
        int maxCount,
        CancellationToken cancellationToken);
}
