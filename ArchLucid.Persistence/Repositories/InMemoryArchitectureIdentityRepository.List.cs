using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryArchitectureIdentityRepository
{
    private readonly IDraftRequestRepository? _draftRequestRepository;
    private readonly IRunRepository? _runRepository;
    private readonly IArchitectureVersionRepository? _architectureVersionRepository;

    public InMemoryArchitectureIdentityRepository()
    {
    }

    public InMemoryArchitectureIdentityRepository(
        IDraftRequestRepository draftRequestRepository,
        IRunRepository runRepository,
        IArchitectureVersionRepository? architectureVersionRepository = null)
    {
        _draftRequestRepository = draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));
        _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
        _architectureVersionRepository = architectureVersionRepository;
    }

    public async Task<PagedResponse<ArchitectureIdentityListItem>> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);

        List<ArchitectureIdentityRecord> identities = _byId.Values
            .Where(record =>
                record.TenantId == scope.TenantId
                && record.WorkspaceId == scope.WorkspaceId
                && record.ScopeProjectId == scope.ProjectId)
            .OrderByDescending(record => record.UpdatedUtc)
            .ThenByDescending(record => record.ArchitectureId)
            .ToList();

        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        List<ArchitectureIdentityRecord> pageRecords = identities.Skip(skip).Take(safePageSize).ToList();

        List<ArchitectureIdentityListItem> items = [];

        foreach (ArchitectureIdentityRecord record in pageRecords)
        {
            items.Add(await BuildListItemAsync(scope, record, cancellationToken));
        }

        return PagedResponseBuilder.FromDatabasePage(items, identities.Count, safePage, safePageSize);
    }

    public async Task<ArchitectureIdentityDetail?> GetDetailAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? identity = await GetByIdAsync(scope, architectureId, cancellationToken);

        if (identity is null)
            return null;

        IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts =
            await ListChildDraftSummariesAsync(scope, architectureId, cancellationToken);
        IReadOnlyList<ArchitectureIdentityChildReviewSummary> reviews =
            await ListChildReviewSummariesAsync(scope, architectureId, cancellationToken);
        IReadOnlyList<ArchitectureIdentityVersionSummary> versions =
            await ListChildVersionSummariesAsync(scope, architectureId, cancellationToken);

        Guid? currentDraftId = SelectCurrentDraftId(drafts);
        Guid? latestReviewId = reviews.FirstOrDefault()?.RunId;

        return new ArchitectureIdentityDetail
        {
            ArchitectureId = identity.ArchitectureId,
            DisplayName = identity.DisplayName,
            Description = identity.Description,
            CurrentModelId = identity.CurrentModelId,
            LatestSealedManifestId = identity.LatestSealedManifestId,
            CurrentDraftId = currentDraftId,
            LatestReviewId = latestReviewId,
            DraftCount = drafts.Count,
            ReviewCount = reviews.Count,
            CreatedUtc = identity.CreatedUtc,
            UpdatedUtc = identity.UpdatedUtc,
            Drafts = drafts,
            Reviews = reviews,
            Versions = versions,
        };
    }

    private static Guid? SelectCurrentDraftId(IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts)
    {
        ArchitectureIdentityChildDraftSummary? draftingDraft = drafts.FirstOrDefault(draft => draft.Status == DraftRequestStatus.Drafting);

        if (draftingDraft is not null)
            return draftingDraft.DraftId;

        ArchitectureIdentityChildDraftSummary? spawnLockedDraft = drafts.FirstOrDefault(draft => draft.Status == DraftRequestStatus.RunSpawned);

        if (spawnLockedDraft is not null)
            return spawnLockedDraft.DraftId;

        return null;
    }

    private async Task<ArchitectureIdentityListItem> BuildListItemAsync(
        ScopeContext scope,
        ArchitectureIdentityRecord record,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts =
            await ListChildDraftSummariesAsync(scope, record.ArchitectureId, cancellationToken);
        IReadOnlyList<ArchitectureIdentityChildReviewSummary> reviews =
            await ListChildReviewSummariesAsync(scope, record.ArchitectureId, cancellationToken);

        return new ArchitectureIdentityListItem
        {
            ArchitectureId = record.ArchitectureId,
            DisplayName = record.DisplayName,
            UpdatedUtc = record.UpdatedUtc,
            LatestSealedManifestId = record.LatestSealedManifestId,
            CurrentDraftId = SelectCurrentDraftId(drafts),
            LatestReviewId = reviews.FirstOrDefault()?.RunId,
            DraftCount = drafts.Count,
            ReviewCount = reviews.Count,
        };
    }

    private async Task<IReadOnlyList<ArchitectureIdentityChildDraftSummary>> ListChildDraftSummariesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        if (_draftRequestRepository is null)
            return [];

        IReadOnlyList<DraftRequestResponse> drafts = await _draftRequestRepository.ListByArchitectureIdAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            architectureId,
            cancellationToken);

        return drafts
            .Select(draft => new ArchitectureIdentityChildDraftSummary
            {
                DraftId = draft.DraftId,
                Status = draft.Status,
                SystemName = draft.Document.SystemName,
                UpdatedUtc = draft.UpdatedUtc,
            })
            .ToList();
    }

    private async Task<IReadOnlyList<ArchitectureIdentityVersionSummary>> ListChildVersionSummariesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        if (_architectureVersionRepository is null || _runRepository is null)
            return [];

        IReadOnlyList<ArchitectureVersionRecord> versions = await _architectureVersionRepository
            .ListByArchitectureIdAsync(scope, architectureId, cancellationToken);
        IReadOnlyList<RunRecord> runs = await _runRepository.ListByArchitectureIdAsync(scope, architectureId, cancellationToken);

        return versions
            .Select(version => new ArchitectureIdentityVersionSummary
            {
                ArchitectureVersionId = version.ArchitectureVersionId,
                VersionNumber = version.VersionNumber,
                CreatedUtc = version.CreatedUtc,
                LinkedReviewId = runs.FirstOrDefault(run => run.ArchitectureVersionId == version.ArchitectureVersionId)?.RunId,
            })
            .ToList();
    }

    private async Task<IReadOnlyList<ArchitectureIdentityChildReviewSummary>> ListChildReviewSummariesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        if (_runRepository is null)
            return [];

        IReadOnlyList<RunRecord> runs = await _runRepository.ListByArchitectureIdAsync(
            scope,
            architectureId,
            cancellationToken);

        return runs
            .Select(run => new ArchitectureIdentityChildReviewSummary
            {
                RunId = run.RunId,
                Description = run.Description,
                CreatedUtc = run.CreatedUtc,
            })
            .ToList();
    }
}
