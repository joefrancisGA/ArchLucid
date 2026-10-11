namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IInfrastructureDiagramDocumentationDecisionRepository
{
    Task UpsertAsync(
        InfrastructureDiagramDocumentationDecisionPersistRecord record,
        CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid scopeId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetLatestBySubjectAsync(
        Guid tenantId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default);
}
