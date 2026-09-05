using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
{
    public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>([]);

    public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
        Guid tenantId,
        Guid controlId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>([]);
}
