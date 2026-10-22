using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditControlEvaluationRepository
{
    Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default);

    Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditControlEvaluationPersistRequest request,
        CancellationToken cancellationToken = default) =>
        InsertAsync(request, cancellationToken);

    Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
        Guid tenantId,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<AuditControlEvaluationRecord?> TryGetLatestByControlInScopeAsync(
        ProjectScopeKey scope,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetLatestByControlAsync(scope.TenantId, controlId, snapshotId, cancellationToken);

    Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
        Guid tenantId,
        Guid evaluationId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationInScopeAsync(
        ProjectScopeKey scope,
        Guid evaluationId,
        CancellationToken cancellationToken = default) =>
        ListEvidenceItemsByEvaluationAsync(scope.TenantId, evaluationId, cancellationToken);
}
