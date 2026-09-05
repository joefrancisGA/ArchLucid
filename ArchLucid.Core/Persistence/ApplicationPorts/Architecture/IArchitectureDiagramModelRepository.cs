namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureDiagramModelRepository
{
    Task UpsertAsync(ArchitectureDiagramModelPersistRecord record, CancellationToken cancellationToken = default);

    Task<ArchitectureDiagramModelPersistRecord?> TryGetByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default);
}
