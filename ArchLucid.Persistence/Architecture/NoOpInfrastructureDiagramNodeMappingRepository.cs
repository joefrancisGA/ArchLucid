using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpInfrastructureDiagramNodeMappingRepository : IInfrastructureDiagramNodeMappingRepository
{
    public Task UpsertAsync(InfrastructureDiagramNodeMappingPersistRecord record, CancellationToken cancellationToken = default)
    {
        _ = record;
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        _ = tenantId;
        _ = snapshotId;
        return Task.FromResult<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>>([]);
    }
}
