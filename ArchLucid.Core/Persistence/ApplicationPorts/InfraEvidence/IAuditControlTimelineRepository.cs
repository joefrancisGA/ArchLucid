namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditControlTimelineRepository
{
    Task UpsertAsync(AuditControlTechnicalTimelineRecord record, CancellationToken cancellationToken = default);

    Task<AuditControlTechnicalTimelineRecord?> TryGetLatestAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default);
}
