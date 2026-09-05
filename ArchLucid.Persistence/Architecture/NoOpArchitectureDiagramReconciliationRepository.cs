using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpArchitectureDiagramReconciliationRepository : IArchitectureDiagramReconciliationRepository
{
    public Task UpsertAsync(ArchitectureDiagramReconciliationPersistRecord record, CancellationToken cancellationToken = default)
    {
        _ = record;
        _ = cancellationToken;

        return Task.CompletedTask;
    }

    public Task<ArchitectureDiagramReconciliationPersistRecord?> TryGetByRunAndSnapshotAsync(
        Guid tenantId,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        _ = tenantId;
        _ = runId;
        _ = snapshotId;
        _ = cancellationToken;

        return Task.FromResult<ArchitectureDiagramReconciliationPersistRecord?>(null);
    }
}
