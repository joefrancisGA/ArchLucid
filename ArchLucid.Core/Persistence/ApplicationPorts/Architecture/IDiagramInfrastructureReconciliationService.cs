using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IDiagramInfrastructureReconciliationService
{
    Task<DiagramInfrastructureReconciliationResult> ReconcileAsync(
        ScopeContext scope,
        Guid runId,
        DiagramInfrastructureReconciliationRequest request,
        CancellationToken cancellationToken = default);

    Task<DiagramInfrastructureReconciliationResult?> TryGetReconciliationAsync(
        ScopeContext scope,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<InfrastructureDiagramDocumentationDecision> SaveDocumentationDecisionAsync(
        ScopeContext scope,
        Guid runId,
        InfrastructureDiagramDocumentationDecisionSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfrastructureDiagramDocumentationDecision>?> TryListDocumentationDecisionsAsync(
        ScopeContext scope,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
