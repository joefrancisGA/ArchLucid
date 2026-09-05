using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditAssessmentRepository : IAuditAssessmentRepository
{
    public Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AuditAssessmentRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditAssessmentRecord?>(null);

    public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditAssessmentRecord>>([]);

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid assessmentId,
        AuditAssessmentStatus status,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
