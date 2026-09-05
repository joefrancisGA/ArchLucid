namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceRequirementRepository
{
    Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByControlIdAsync(
        Guid tenantId,
        Guid controlId,
        CancellationToken cancellationToken = default);
}
