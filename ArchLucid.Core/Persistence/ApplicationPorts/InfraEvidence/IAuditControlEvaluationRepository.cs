using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditControlEvaluationRepository
{
    Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default);

    Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditControlEvaluationPersistRequest request,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
        Guid tenantId,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    async Task<AuditControlEvaluationRecord?> TryGetLatestByControlInScopeAsync(
        ProjectScopeKey scope,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return await TryGetLatestByControlAsync(scope.TenantId, controlId, snapshotId, cancellationToken);
    }

    Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
        Guid tenantId,
        Guid evaluationId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationInScopeAsync(
        ProjectScopeKey scope,
        Guid evaluationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return await ListEvidenceItemsByEvaluationAsync(scope.TenantId, evaluationId, cancellationToken);
    }
}
