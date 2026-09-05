using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditControlTimelineRepository : IAuditControlTimelineRepository
{
    public Task UpsertAsync(AuditControlTechnicalTimelineRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AuditControlTechnicalTimelineRecord?> TryGetLatestAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditControlTechnicalTimelineRecord?>(null);
}
