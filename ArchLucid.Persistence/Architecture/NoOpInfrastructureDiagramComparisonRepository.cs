using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class NoOpInfrastructureDiagramComparisonRepository : IInfrastructureDiagramComparisonRepository
{
    public Task UpsertAsync(InfrastructureDiagramComparisonPersistRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _ = record;
        return Task.CompletedTask;
    }

    public Task<InfrastructureDiagramComparisonPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid comparisonId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _ = tenantId;
        _ = comparisonId;
        return Task.FromResult<InfrastructureDiagramComparisonPersistRecord?>(null);
    }
}
