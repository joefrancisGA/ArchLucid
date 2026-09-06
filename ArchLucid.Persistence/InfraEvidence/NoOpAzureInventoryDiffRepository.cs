using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAzureInventoryDiffRepository : IAzureInventoryDiffRepository
{
    public Task<AzureInventoryDiffSummaryRecord?> TryGetByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventoryDiffSummaryRecord?>(null);

    public Task<AzureInventoryDiffSummaryRecord?> TryGetBySnapshotPairAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventoryDiffSummaryRecord?>(null);

    public Task<AzureInventoryDiffPersistResult> InsertDiffAsync(
        ScopeContext scope,
        AzureInventoryDiffPersistRequest request,
        CancellationToken cancellationToken = default)
        => Task.FromResult(new AzureInventoryDiffPersistResult
        {
            WasExisting = false,
            DiffId = request.DiffId,
            Summary = request.Summary,
        });

    public Task<IReadOnlyList<AzureInventoryChangeRecord>> ListChangesByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryChangeRecord>>([]);

    public Task<IReadOnlyList<AzureInventoryDiffSummaryRecord>> ListDiffsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryDiffSummaryRecord>>([]);

    public Task<(IReadOnlyList<AzureInventoryChangeRecord> Items, int TotalCount)> ListChangesByDiffIdPagedAsync(
        ScopeContext scope,
        Guid diffId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
        => Task.FromResult<(IReadOnlyList<AzureInventoryChangeRecord>, int)>(([], 0));
}
