using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class InfraEvidenceDriftWorkbenchQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffRepository diffRepository) : IInfraEvidenceDriftWorkbenchQueryService
{
    public async Task<PagedResponse<AzureInventorySnapshotRecord>> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (IReadOnlyList<AzureInventorySnapshotRecord> items, int totalCount) =
            await snapshotRepository.ListSnapshotsAsync(scope, page, pageSize, subscriptionId, cancellationToken);

        return PagedResponseBuilder.FromDatabasePage(items, totalCount, page, pageSize);
    }

    public async Task<IReadOnlyList<AzureInventoryDiffSummaryRecord>?> ListDiffsForSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
            return null;

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
            return null;

        return await diffRepository.ListDiffsBySnapshotIdAsync(scope, snapshotId, cancellationToken);
    }

    public async Task<PagedResponse<AzureInventoryChangeRecord>?> ListChangesForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (diffId == Guid.Empty)
            return null;

        AzureInventoryDiffSummaryRecord? diff =
            await diffRepository.TryGetByDiffIdAsync(scope, diffId, cancellationToken);

        if (diff is null)
            return null;

        (IReadOnlyList<AzureInventoryChangeRecord> items, int totalCount) =
            await diffRepository.ListChangesByDiffIdPagedAsync(scope, diffId, page, pageSize, cancellationToken);

        return PagedResponseBuilder.FromDatabasePage(items, totalCount, page, pageSize);
    }
}
