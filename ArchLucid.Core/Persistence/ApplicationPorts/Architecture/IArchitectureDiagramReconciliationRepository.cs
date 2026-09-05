namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureDiagramReconciliationRepository
{
    Task UpsertAsync(ArchitectureDiagramReconciliationPersistRecord record, CancellationToken cancellationToken = default);

    Task<ArchitectureDiagramReconciliationPersistRecord?> TryGetByRunAndSnapshotAsync(
        Guid tenantId,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
