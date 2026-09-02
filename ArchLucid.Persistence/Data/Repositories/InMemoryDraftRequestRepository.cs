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

    private readonly ConcurrentDictionary<Guid, StoredDraft> _drafts = new();

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        if (!_drafts.TryGetValue(draftId, out StoredDraft? stored))
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
        StoredDraft stored = new()
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

        if (!_drafts.TryGetValue(draftId, out StoredDraft? stored))
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

        foreach (KeyValuePair<Guid, StoredDraft> entry in _drafts.ToArray())
        {
            if (deleted.Count >= effectiveBatchSize)
                break;

            StoredDraft stored = entry.Value;

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
        int effectiveMax = DraftRequestRepositoryCore.ClampPriorDraftsMaxCount(maxCount);
        List<DraftRequestResponse> matches = _drafts.Values
            .Where(stored =>
                DraftRequestRepositoryCore.MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId)
                && DraftRequestRepositoryCore.MatchesRunSpawnedInScope(
                    stored.Status,
                    stored.DraftId,
                    excludeDraftId))
            .OrderByDescending(stored => stored.UpdatedUtc)
            .Take(effectiveMax)
            .Select(Map)
            .ToList();

        return Task.FromResult<IReadOnlyList<DraftRequestResponse>>(matches);
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
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);
        DraftRequestRepositoryCore.ValidateStatusFilter(statuses);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        HashSet<DraftRequestStatus> statusFilter = statuses.ToHashSet();

        List<DraftRequestResponse> matches = _drafts.Values
            .Where(stored =>
                stored.TenantId == tenantId
                && stored.WorkspaceId == workspaceId
                && DraftRequestRepositoryCore.MatchesCreatorInWorkspace(
                    stored.CreatedByUserId,
                    stored.Status,
                    createdByUserId,
                    statusFilter))
            .OrderByDescending(stored => stored.UpdatedUtc)
            .Select(Map)
            .ToList();

        IReadOnlyList<DraftRequestResponse> pageItems = matches.Skip(skip).Take(safePageSize).ToList();

        return Task.FromResult(PagedResponseBuilder.FromDatabasePage(pageItems, matches.Count, safePage, safePageSize));
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetBySpawnedRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string spawnedRunId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(spawnedRunId);

        StoredDraft? match = _drafts.Values.FirstOrDefault(stored =>
            DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                stored.TenantId,
                stored.WorkspaceId,
                stored.ProjectId)
            && DraftRequestRepositoryCore.MatchesSpawnedRunId(stored.SpawnedRunId, spawnedRunId));

        return Task.FromResult(match is null ? null : Map(match));
    }

    private static DraftRequestResponse Map(StoredDraft stored) =>
        new()
        {
            DraftId = stored.DraftId,
            TenantId = stored.TenantId,
            WorkspaceId = stored.WorkspaceId,
            ProjectId = stored.ProjectId,
            Status = stored.Status,
            Document = DraftRequestRepositoryCore.CloneDocument(stored.Document, JsonOptions),
            RedirectReason = stored.RedirectReason,
            SpawnedRunId = stored.SpawnedRunId,
            SpawnedArchitectureVersionId = stored.SpawnedArchitectureVersionId,
            DocumentContentHashSha256 = stored.DocumentContentHashSha256,
            SpawnedDocumentContentHashSha256 = stored.SpawnedDocumentContentHashSha256,
            CreatedByUserId = stored.CreatedByUserId,
            CreatedUtc = stored.CreatedUtc,
            UpdatedUtc = stored.UpdatedUtc,
        };


    private sealed class StoredDraft
    {
        public Guid DraftId
        {
            get;
            set;
        }

        public Guid TenantId
        {
            get;
            set;
        }

        public Guid WorkspaceId
        {
            get;
            set;
        }

        public Guid ProjectId
        {
            get;
            set;
        }

        public string CreatedByUserId
        {
            get;
            set;
        } = string.Empty;

        public DraftRequestStatus Status
        {
            get;
            set;
        }

        public DraftRequestDocument Document
        {
            get;
            set;
        } = new();

        public string? RedirectReason
        {
            get;
            set;
        }

        public string? SpawnedRunId
        {
            get;
            set;
        }

        public Guid? SpawnedArchitectureVersionId
        {
            get;
            set;
        }

        public byte[]? DocumentContentHashSha256
        {
            get;
            set;
        }

        public byte[]? SpawnedDocumentContentHashSha256
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public DateTime UpdatedUtc
        {
            get;
            set;
        }
    }
}
