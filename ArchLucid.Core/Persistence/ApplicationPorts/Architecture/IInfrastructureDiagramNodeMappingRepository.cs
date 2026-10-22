namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IInfrastructureDiagramNodeMappingRepository
{
    Task UpsertAsync(InfrastructureDiagramNodeMappingPersistRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
