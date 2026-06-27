using System.Collections.Concurrent;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

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

        if (stored.TenantId != tenantId || stored.WorkspaceId != workspaceId || stored.ProjectId != projectId)
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
            Document = CloneDocument(document),
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
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!_drafts.TryGetValue(draftId, out StoredDraft? stored))
            return Task.FromResult<DraftRequestResponse?>(null);

        if (stored.TenantId != tenantId || stored.WorkspaceId != workspaceId || stored.ProjectId != projectId)
            return Task.FromResult<DraftRequestResponse?>(null);

        stored.Status = status;
        stored.Document = CloneDocument(document);
        stored.RedirectReason = redirectReason;
        stored.SpawnedRunId = spawnedRunId;
        stored.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.FromResult<DraftRequestResponse?>(Map(stored));
    }

    /// <inheritdoc />
    public Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        int effectiveBatchSize = Math.Clamp(batchSize, 1, 10_000);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;
        List<Guid> deleted = [];

        foreach (KeyValuePair<Guid, StoredDraft> entry in _drafts.ToArray())
        {
            if (deleted.Count >= effectiveBatchSize)
                break;

            StoredDraft stored = entry.Value;

            if (stored.Status is not (DraftRequestStatus.Redirected or DraftRequestStatus.Abandoned))
                continue;

            if (stored.UpdatedUtc >= cutoff)
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
            stored.TenantId == tenantId
            && stored.WorkspaceId == workspaceId
            && stored.ProjectId == projectId
            && stored.Document.ParentDraftId == parentDraftId);

        return Task.FromResult(count);
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
        int effectiveMax = Math.Clamp(maxCount, 1, MaxPriorDraftsCap);
        List<DraftRequestResponse> matches = _drafts.Values
            .Where(stored =>
                stored.TenantId == tenantId
                && stored.WorkspaceId == workspaceId
                && stored.ProjectId == projectId
                && stored.Status == DraftRequestStatus.RunSpawned
                && stored.DraftId != excludeDraftId)
            .OrderByDescending(stored => stored.UpdatedUtc)
            .Take(effectiveMax)
            .Select(Map)
            .ToList();

        return Task.FromResult<IReadOnlyList<DraftRequestResponse>>(matches);
    }

    private const int MaxPriorDraftsCap = 25;

    private static DraftRequestResponse Map(StoredDraft stored) =>
        new()
        {
            DraftId = stored.DraftId,
            TenantId = stored.TenantId,
            WorkspaceId = stored.WorkspaceId,
            ProjectId = stored.ProjectId,
            Status = stored.Status,
            Document = CloneDocument(stored.Document),
            RedirectReason = stored.RedirectReason,
            SpawnedRunId = stored.SpawnedRunId,
            CreatedUtc = stored.CreatedUtc,
            UpdatedUtc = stored.UpdatedUtc,
        };

    private static DraftRequestDocument CloneDocument(DraftRequestDocument document)
    {
        string json = JsonSerializer.Serialize(document, JsonOptions);
        DraftRequestDocument? clone = JsonSerializer.Deserialize<DraftRequestDocument>(json, JsonOptions);

        return clone ?? throw new InvalidOperationException("Failed to clone draft document.");
    }

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
