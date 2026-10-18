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

    async Task<IReadOnlyList<ArchitectureDiagramReconciliationPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<Guid> runIds = await ListRunIdsBySnapshotAsync(tenantId, snapshotId, cancellationToken);
        List<ArchitectureDiagramReconciliationPersistRecord> records = [];

        foreach (Guid runId in runIds)
        {
            ArchitectureDiagramReconciliationPersistRecord? record =
                await TryGetByRunAndSnapshotAsync(tenantId, runId, snapshotId, cancellationToken);

            if (record is not null)
                records.Add(record);
        }

        return records;
    }
}
