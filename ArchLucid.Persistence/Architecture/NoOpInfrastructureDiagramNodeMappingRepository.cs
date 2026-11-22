using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpInfrastructureDiagramNodeMappingRepository : IInfrastructureDiagramNodeMappingRepository
{
    public Task UpsertAsync(InfrastructureDiagramNodeMappingPersistRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _ = record;
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _ = tenantId;
        _ = snapshotId;
        return Task.FromResult<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>>([]);
    }
}
