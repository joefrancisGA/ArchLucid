using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAzureInventoryDiffRepository : IAzureInventoryDiffRepository
{
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
}
