using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IInfrastructureDiagramComparisonService
{
    Task<DiagramInfrastructureReconciliationResult> CompareAsync(
        ScopeContext scope,
        InfrastructureDiagramComparisonCreateRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);

    Task<DiagramInfrastructureReconciliationResult?> TryGetComparisonAsync(
        ScopeContext scope,
        Guid comparisonId,
        CancellationToken cancellationToken = default);

    Task<DiagramInfrastructureReconciliationResult> SaveNodeMappingAndRefreshAsync(
        ScopeContext scope,
        Guid comparisonId,
        InfrastructureDiagramNodeMappingSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramDocumentationDecision> SaveDocumentationDecisionAsync(
        ScopeContext scope,
        Guid comparisonId,
        InfrastructureDiagramDocumentationDecisionSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramDocumentationDecision?> TryGetDocumentationDecisionAsync(
        ScopeContext scope,
        Guid comparisonId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfrastructureDiagramDocumentationDecision>?> TryListAbsentDocumentationDecisionsAsync(
        ScopeContext scope,
        Guid comparisonId,
        CancellationToken cancellationToken = default);
}
