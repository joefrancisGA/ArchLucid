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
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        InMemoryDraftRequestStoredDraft? stored = FindScoped(tenantId, workspaceId, projectId, draftId);
        return Task.FromResult(stored is null ? null : Map(stored));
    }

    public Task<DraftRequestResponse?> GetAtAccessRevisionAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId,
        DateTime expectedUpdatedUtc, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        InMemoryDraftRequestStoredDraft? stored = FindScoped(tenantId, workspaceId, projectId, draftId);
        return Task.FromResult(stored is not null && stored.UpdatedUtc == expectedUpdatedUtc ? Map(stored) : null);
    }

    public Task<DraftRequestAccessMetadata?> GetAccessMetadataAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        InMemoryDraftRequestStoredDraft? stored = FindScoped(tenantId, workspaceId, projectId, draftId);
        return Task.FromResult(stored is null ? null : new DraftRequestAccessMetadata(
            stored.DraftId, stored.TenantId, stored.WorkspaceId, stored.ProjectId, stored.ArchitectureId,
            stored.CreatedByUserId, stored.Document.PriorRunId, stored.SpawnedRunId, stored.UpdatedUtc));
    }

    private InMemoryDraftRequestStoredDraft? FindScoped(Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId) =>
        _drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored)
        && DraftRequestRepositoryCore.MatchesProjectScope(
            tenantId, workspaceId, projectId, stored.TenantId, stored.WorkspaceId, stored.ProjectId)
            ? stored
            : null;

    /// <inheritdoc />
    public Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

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
    public Task<DraftRequestResponse?> TryBindConversationThreadAsync(
        DraftRequestResponse expected, Guid threadId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(expected);
        ct.ThrowIfCancellationRequested();
        if (threadId == Guid.Empty || expected.DocumentContentHashSha256 is null ||
            !DraftDocumentContentFingerprint.SequenceEqual(expected.DocumentContentHashSha256,
                DraftDocumentContentFingerprint.Compute(expected.Document)) ||
            expected.Status is not (DraftRequestStatus.Drafting or DraftRequestStatus.Admitted) ||
            !_drafts.TryGetValue(expected.DraftId, out InMemoryDraftRequestStoredDraft? stored) ||
            !DraftRequestRepositoryCore.MatchesProjectScope(expected.TenantId, expected.WorkspaceId,
                expected.ProjectId, stored.TenantId, stored.WorkspaceId, stored.ProjectId) ||
            stored.Status != expected.Status || stored.ArchitectureId != expected.ArchitectureId ||
            stored.UpdatedUtc != expected.UpdatedUtc ||
            !DraftDocumentContentFingerprint.SequenceEqual(stored.DocumentContentHashSha256,
                expected.DocumentContentHashSha256))
            return Task.FromResult<DraftRequestResponse?>(null);

        DraftRequestDocument document = DraftRequestRepositoryCore.CloneDocument(stored.Document, JsonOptions);
        document.ConversationThreadId = threadId;
        InMemoryDraftRequestStoredDraft updated = stored with
        {
            Document = document,
            DocumentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document),
            UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        };

        return Task.FromResult<DraftRequestResponse?>(_drafts.TryUpdate(expected.DraftId, updated, stored)
            ? Map(updated) : null);
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
        byte[]? spawnedDocumentContentHashSha256 = null) =>
        UpdateCoreAsync(tenantId, workspaceId, projectId, draftId, status, document, redirectReason,
            spawnedRunId, spawnedArchitectureVersionId, spawnedDocumentContentHashSha256,
            expectedUpdatedUtc: null, cancellationToken);

    public Task<DraftRequestResponse?> UpdateAtAccessRevisionAsync(
        DraftRequestResponse draft, CancellationToken cancellationToken) =>
        UpdateCoreAsync(draft.TenantId, draft.WorkspaceId, draft.ProjectId, draft.DraftId, draft.Status,
            draft.Document, draft.RedirectReason, draft.SpawnedRunId, draft.SpawnedArchitectureVersionId,
            draft.SpawnedDocumentContentHashSha256, draft.UpdatedUtc, cancellationToken);

    private Task<DraftRequestResponse?> UpdateCoreAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId, DraftRequestStatus status,
        DraftRequestDocument document, string? redirectReason, string? spawnedRunId,
        Guid? spawnedArchitectureVersionId, byte[]? spawnedDocumentContentHashSha256,
        DateTime? expectedUpdatedUtc, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(document);

        while (_drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored))
        {
            if (!DraftRequestRepositoryCore.MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId))
                break;

            if (expectedUpdatedUtc is DateTime expected && stored.UpdatedUtc != expected)
                break;

            DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
            if (now <= stored.UpdatedUtc)
                now = stored.UpdatedUtc.AddTicks(1);

            InMemoryDraftRequestStoredDraft updated = stored with
            {
                Status = status,
                Document = DraftRequestRepositoryCore.CloneDocument(document, JsonOptions),
                RedirectReason = redirectReason,
                SpawnedRunId = spawnedRunId,
                SpawnedArchitectureVersionId = spawnedArchitectureVersionId,
                DocumentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document),
                SpawnedDocumentContentHashSha256 = spawnedDocumentContentHashSha256?.ToArray()
                    ?? stored.SpawnedDocumentContentHashSha256,
                UpdatedUtc = now,
            };

            if (_drafts.TryUpdate(draftId, updated, stored))
                return Task.FromResult<DraftRequestResponse?>(Map(updated));
        }

        return Task.FromResult<DraftRequestResponse?>(null);
    }

    /// <inheritdoc />
    public Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        int effectiveBatchSize = DraftRequestRepositoryCore.ClampReaperBatchSize(batchSize);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;
        List<DraftIntakeReapedDraft> deleted = [];

        foreach (KeyValuePair<Guid, InMemoryDraftRequestStoredDraft> entry in _drafts.ToArray())
        {
            if (deleted.Count >= effectiveBatchSize)
                break;

            InMemoryDraftRequestStoredDraft stored = entry.Value;

            if (!DraftRequestRepositoryCore.IsReaperEligible(stored.Status, stored.UpdatedUtc, cutoff))
                continue;

            if (_drafts.TryRemove(entry))
                deleted.Add(new DraftIntakeReapedDraft(stored.DraftId, stored.TenantId, stored.WorkspaceId, stored.ProjectId));
        }

        return Task.FromResult(new DraftIntakeReaperBatchResult
        {
            DeletedDraftIds = deleted.Select(draft => draft.DraftId).ToList(),
            DeletedDrafts = deleted,
        });
    }

    /// <inheritdoc />
    public Task<int> CountChildBranchesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid parentDraftId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

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
        cancellationToken.ThrowIfCancellationRequested();

        while (_drafts.TryGetValue(draftId, out InMemoryDraftRequestStoredDraft? stored))
        {
            if (!DraftRequestRepositoryCore.MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId))
                break;

            DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
            InMemoryDraftRequestStoredDraft updated = stored with
            {
                ArchitectureId = architectureId,
                UpdatedUtc = now <= stored.UpdatedUtc ? stored.UpdatedUtc.AddTicks(1) : now,
            };

            if (_drafts.TryUpdate(draftId, updated, stored))
                return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<DraftRequestResponse>> ListWithNullArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (take <= 0)
            return Task.FromResult<IReadOnlyList<DraftRequestResponse>>([]);

        List<DraftRequestResponse> matches = _drafts.Values
            .Where(stored =>
                !stored.ArchitectureId.HasValue
                && DraftRequestRepositoryCore.MatchesProjectScope(
                    tenantId,
                    workspaceId,
                    projectId,
                    stored.TenantId,
                    stored.WorkspaceId,
                    stored.ProjectId))
            .OrderBy(stored => stored.CreatedUtc)
            .ThenBy(stored => stored.DraftId)
            .Take(take)
            .Select(Map)
            .ToList();

        return Task.FromResult<IReadOnlyList<DraftRequestResponse>>(matches);
    }

    private static DraftRequestResponse Map(InMemoryDraftRequestStoredDraft stored) =>
        DraftRequestRepositoryCore.MapInMemoryStoredDraft(stored, JsonOptions);
}
