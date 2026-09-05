using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public interface IAzureInventorySnapshotPostMaterializeCoordinator
{
    Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventorySnapshotPostMaterializeCoordinator(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffService diffService) : IAzureInventorySnapshotPostMaterializeCoordinator
{
    public async Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(subscriptionId))
            return;

        Guid? priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
            scope,
            subscriptionId,
            snapshotId,
            cancellationToken);

        if (priorSnapshotId is null || priorSnapshotId == Guid.Empty)
            return;

        await diffService.ComputeAndPersistDiffAsync(
            scope,
            priorSnapshotId.Value,
            snapshotId,
            cancellationToken);
    }
}
