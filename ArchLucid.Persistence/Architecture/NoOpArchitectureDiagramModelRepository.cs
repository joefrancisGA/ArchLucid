using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpArchitectureDiagramModelRepository : IArchitectureDiagramModelRepository
{
    public Task UpsertAsync(ArchitectureDiagramModelPersistRecord record, CancellationToken cancellationToken = default)
    {
        _ = record;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<ArchitectureDiagramModelPersistRecord?> TryGetByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        _ = tenantId;
        _ = runId;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<ArchitectureDiagramModelPersistRecord?>(null);
    }
}
