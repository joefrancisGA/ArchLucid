using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditControlEvaluationRepository : IAuditControlEvaluationRepository
{
    public Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
        Guid tenantId,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditControlEvaluationRecord?>(null);

    public Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
        Guid tenantId,
        Guid evaluationId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceItemRecord>>([]);

    public Task InsertInScopeAsync(ProjectScopeKey scope, AuditControlEvaluationPersistRequest request,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task<AuditControlEvaluationRecord?> TryGetLatestByControlInScopeAsync(ProjectScopeKey scope,
        Guid controlId, Guid snapshotId, CancellationToken cancellationToken = default)
        => Task.FromResult<AuditControlEvaluationRecord?>(null);

    public Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationInScopeAsync(ProjectScopeKey scope,
        Guid evaluationId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceItemRecord>>([]);
}
