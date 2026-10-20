namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureDiagramReconciliationRepository
{
    Task UpsertAsync(ArchitectureDiagramReconciliationPersistRecord record, CancellationToken cancellationToken = default);

    Task<ArchitectureDiagramReconciliationPersistRecord?> TryGetByRunAndSnapshotAsync(
        Guid tenantId,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> ListRunIdsBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureDiagramReconciliationPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<ArchitectureDiagramReconciliationSnapshotRunRecord>> ListRunIdsBySnapshotIdsAsync(
        Guid tenantId,
        IReadOnlyList<Guid> snapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(snapshotIds);

        List<ArchitectureDiagramReconciliationSnapshotRunRecord> results = [];

        foreach (Guid snapshotId in snapshotIds.Where(id => id != Guid.Empty).Distinct())
        {
            IReadOnlyList<Guid> runIds = await ListRunIdsBySnapshotAsync(tenantId, snapshotId, cancellationToken);

            foreach (Guid runId in runIds.Where(id => id != Guid.Empty))
            {
                results.Add(new ArchitectureDiagramReconciliationSnapshotRunRecord
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                });
            }
        }

        return results;
    }
}
