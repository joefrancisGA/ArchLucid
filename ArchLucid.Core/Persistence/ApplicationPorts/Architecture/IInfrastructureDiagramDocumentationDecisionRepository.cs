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
        string diagramFingerprint,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord>> ListByDiagramFingerprintAsync(
        Guid tenantId,
        string diagramFingerprint,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord>> ListByScopeAndDiagramFingerprintAsync(
        Guid tenantId,
        Guid scopeId,
        string diagramFingerprint,
        CancellationToken cancellationToken = default);
}
