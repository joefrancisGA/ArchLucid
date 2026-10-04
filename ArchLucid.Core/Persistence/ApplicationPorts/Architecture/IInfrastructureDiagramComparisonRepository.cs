namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IInfrastructureDiagramComparisonRepository
{
    Task UpsertAsync(InfrastructureDiagramComparisonPersistRecord record, CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramComparisonPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid comparisonId,
        CancellationToken cancellationToken = default);
}
