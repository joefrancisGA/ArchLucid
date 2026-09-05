using System.Collections.Concurrent;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory draft storage for integration tests without SQL.</summary>
public sealed class InMemoryDraftRequestRepository : IDraftRequestRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ConcurrentDictionary<Guid, InMemoryDraftRequestStoredDraft> _drafts = new();

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        if (!_drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored))
            return Task.FromResult<DraftRequestResponse?>(null);

        if (!DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId))
            return Task.FromResult<DraftRequestResponse?>(null);

        return Task.FromResult<DraftRequestResponse?>(Map(stored));
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        InMemoryDraftRequestStoredDraft stored = new()
        {
            DraftId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedByUserId = createdByUserId,
            Status = DraftRequestStatus.Drafting,
            Document = DraftRequestRepositoryCore.CloneDocument(document, JsonOptions),
            DocumentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document),
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        _drafts[stored.DraftId] = stored;
        return Task.FromResult(Map(stored));
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> UpdateAsync(
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
        byte[]? spawnedDocumentContentHashSha256 = null)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!_drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored))
            return Task.FromResult<DraftRequestResponse?>(null);

        if (!DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId))
            return Task.FromResult<DraftRequestResponse?>(null);

        stored.Status = status;
        stored.Document = DraftRequestRepositoryCore.CloneDocument(document, JsonOptions);
        stored.RedirectReason = redirectReason;
        stored.SpawnedRunId = spawnedRunId;
        stored.SpawnedArchitectureVersionId = spawnedArchitectureVersionId;
        stored.DocumentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document);

        if (spawnedDocumentContentHashSha256 is not null)
            stored.SpawnedDocumentContentHashSha256 = spawnedDocumentContentHashSha256.ToArray();

        stored.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.FromResult<DraftRequestResponse?>(Map(stored));
    }

    /// <inheritdoc />
    public Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        int effectiveBatchSize = DraftRequestRepositoryCore.ClampReaperBatchSize(batchSize);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;
        List<Guid> deleted = [];

        foreach (KeyValuePair<Guid, InMemoryDraftRequestStoredDraft> entry in _drafts.ToArray())
        {
            if (deleted.Count >= effectiveBatchSize)
                break;

            InMemoryDraftRequestStoredDraft stored = entry.Value;

            if (!DraftRequestRepositoryCore.IsReaperEligible(stored.Status, stored.UpdatedUtc, cutoff))
                continue;

            if (_drafts.TryRemove(entry.Key, out _))
                deleted.Add(entry.Key);
        }

        return Task.FromResult(new DraftIntakeReaperBatchResult { DeletedDraftIds = deleted });
    }

    /// <inheritdoc />
    public Task<int> CountChildBranchesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid parentDraftId,
        CancellationToken cancellationToken)
    {
        int count = _drafts.Values.Count(stored =>
            DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId)
            && DraftRequestRepositoryCore.MatchesChildBranch(stored.Document.ParentDraftId, parentDraftId));

        return Task.FromResult(count);
    }

    /// <inheritdoc />
    public Task<bool> ExistsMutableDraftWithSystemNameInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string systemName,
        Guid? excludeDraftId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            throw new ArgumentException("System name is required.", nameof(systemName));

        string normalizedName = DraftRequestRepositoryCore.NormalizeSystemName(systemName);

        bool exists = _drafts.Values.Any(stored =>
            stored.TenantId == tenantId
            && stored.WorkspaceId == workspaceId
            && DraftRequestRepositoryCore.IsMutableDraftStatus(stored.Status)
            && DraftRequestRepositoryCore.MatchesMutableSystemName(
                stored.Document.SystemName,
                normalizedName,
                stored.DraftId,
                excludeDraftId));

        return Task.FromResult(exists);
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
        IReadOnlyList<DraftRequestResponse> matches = DraftRequestRepositoryCore.ListRunSpawnedInScope(
            _drafts.Values,
            tenantId,
            workspaceId,
            projectId,
            excludeDraftId,
            maxCount,
            Map);

        return Task.FromResult(matches);
    }

    /// <inheritdoc />
    public Task<PagedResponse<DraftRequestResponse>> ListForCreatorInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string createdByUserId,
        IReadOnlyList<DraftRequestStatus> statuses,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        (IReadOnlyList<DraftRequestResponse> pageItems, int totalCount) =
            DraftRequestRepositoryCore.ListForCreatorInWorkspace(
                _drafts.Values,
                tenantId,
                workspaceId,
                createdByUserId,
                statuses,
                page,
                pageSize,
                Map);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);

        return Task.FromResult(PagedResponseBuilder.FromDatabasePage(pageItems, totalCount, safePage, safePageSize));
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetBySpawnedRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string spawnedRunId,
        CancellationToken cancellationToken)
    {
        InMemoryDraftRequestStoredDraft? match = DraftRequestRepositoryCore.FindBySpawnedRunId(
            _drafts.Values,
            tenantId,
            workspaceId,
            projectId,
            spawnedRunId);

        return Task.FromResult(match is null ? null : Map(match));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<DraftRequestResponse>> ListByArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        List<DraftRequestResponse> matches = _drafts.Values
            .Where(stored =>
                stored.ArchitectureId == architectureId
                && DraftRequestRepositoryCore.MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId))
            .OrderByDescending(stored => stored.UpdatedUtc)
            .ThenByDescending(stored => stored.DraftId)
            .Select(Map)
            .ToList();

        return Task.FromResult<IReadOnlyList<DraftRequestResponse>>(matches);
    }

    /// <inheritdoc />
    public Task<int> CountByArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        int count = _drafts.Values.Count(stored =>
            stored.ArchitectureId == architectureId
            && DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId));

        return Task.FromResult(count);
    }

    /// <inheritdoc />
    public Task<bool> SetArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        if (!_drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored))
            return Task.FromResult(false);

        if (!DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId))
            return Task.FromResult(false);

        stored.ArchitectureId = architectureId;
        stored.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.FromResult(true);
    }

    private static DraftRequestResponse Map(InMemoryDraftRequestStoredDraft stored) =>
        DraftRequestRepositoryCore.MapInMemoryStoredDraft(stored, JsonOptions);
}
