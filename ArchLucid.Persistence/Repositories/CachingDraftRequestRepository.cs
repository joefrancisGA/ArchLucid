using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="IDraftRequestRepository.GetAsync" /> with hot-path read caching for architecture draft open.
/// </summary>
public sealed class CachingDraftRequestRepository(
    IDraftRequestRepository inner,
    IHotPathReadCache hotPathReadCache) : IDraftRequestRepository
{
    private readonly IDraftRequestRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.DraftRequest(scope, draftId),
            innerCt => _inner.GetAsync(tenantId, workspaceId, projectId, draftId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        DraftRequestResponse created = await _inner.CreateAsync(
            tenantId,
            workspaceId,
            projectId,
            createdByUserId,
            document,
            cancellationToken);

        await InvalidateDraftAsync(tenantId, workspaceId, projectId, created.DraftId, cancellationToken);

        return created;
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken)
    {
        DraftRequestResponse? updated = await _inner.UpdateAsync(
            tenantId,
            workspaceId,
            projectId,
            draftId,
            status,
            document,
            redirectReason,
            spawnedRunId,
            cancellationToken);

        if (updated is not null)
        {
            await InvalidateDraftAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);
        }

        return updated;
    }

    /// <inheritdoc />
    public Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        return _inner.HardDeleteTerminalDraftsBatchAsync(updatedBeforeUtc, batchSize, cancellationToken);
    }

    /// <inheritdoc />
    public Task<int> CountChildBranchesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid parentDraftId,
        CancellationToken cancellationToken)
    {
        return _inner.CountChildBranchesAsync(tenantId, workspaceId, projectId, parentDraftId, cancellationToken);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<DraftRequestResponse>> ListRunSpawnedInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid excludeDraftId,
        int maxCount,
        CancellationToken cancellationToken)
    {
        return _inner.ListRunSpawnedInScopeAsync(
            tenantId,
            workspaceId,
            projectId,
            excludeDraftId,
            maxCount,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<bool> ExistsMutableDraftWithSystemNameInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string systemName,
        Guid? excludeDraftId,
        CancellationToken cancellationToken)
    {
        return _inner.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
            tenantId,
            workspaceId,
            systemName,
            excludeDraftId,
            cancellationToken);
    }

    private Task InvalidateDraftAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        return HotPathCacheEviction.RemoveDraftRequestAsync(_hotPathReadCache, scope, draftId, cancellationToken);
    }
}
