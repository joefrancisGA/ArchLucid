using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditEvidenceRequirementRepository : IAuditEvidenceRequirementRepository
{
    public Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceRequirementRecord>>([]);
}
