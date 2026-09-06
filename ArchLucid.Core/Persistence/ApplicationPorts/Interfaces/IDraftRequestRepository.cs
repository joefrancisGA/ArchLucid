using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;

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
        CancellationToken cancellationToken,
        Guid? spawnedArchitectureVersionId = null,
        byte[]? spawnedDocumentContentHashSha256 = null);

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

    /// <summary>
    ///     Returns <see langword="true" /> when the workspace has a mutable draft
    ///     (<see cref="DraftRequestStatus.Drafting" /> or <see cref="DraftRequestStatus.Admitted" />) whose document
    ///     <c>systemName</c> matches <paramref name="systemName" /> case-insensitively.
    /// </summary>
    Task<bool> ExistsMutableDraftWithSystemNameInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string systemName,
        Guid? excludeDraftId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Lists drafts for the signed-in creator across all projects in a workspace,
    ///     newest <see cref="DraftRequestResponse.UpdatedUtc" /> first.
    /// </summary>
    Task<PagedResponse<DraftRequestResponse>> ListForCreatorInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string createdByUserId,
        IReadOnlyList<DraftRequestStatus> statuses,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    /// <summary>Wave-5 suggestion 44: lookup draft that spawned a run for commit-time hash verification.</summary>
    Task<DraftRequestResponse?> GetBySpawnedRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string spawnedRunId,
        CancellationToken cancellationToken);

    /// <summary>Sets the parent architecture FK when still null or matching the existing value.</summary>
    Task<bool> TrySetArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        Guid architectureId,
        CancellationToken cancellationToken);
}
