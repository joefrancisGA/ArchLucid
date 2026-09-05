namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditControlEvaluationRepository
{
    Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default);

    Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
        Guid tenantId,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
        Guid tenantId,
        Guid evaluationId,
        CancellationToken cancellationToken = default);
}
