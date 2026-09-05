using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpArchitectureDiagramModelRepository : IArchitectureDiagramModelRepository
{
    public Task UpsertAsync(ArchitectureDiagramModelPersistRecord record, CancellationToken cancellationToken = default)
    {
        _ = record;
        _ = cancellationToken;

        return Task.CompletedTask;
    }

    public Task<ArchitectureDiagramModelPersistRecord?> TryGetByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        _ = tenantId;
        _ = runId;
        _ = cancellationToken;

        return Task.FromResult<ArchitectureDiagramModelPersistRecord?>(null);
    }
}
