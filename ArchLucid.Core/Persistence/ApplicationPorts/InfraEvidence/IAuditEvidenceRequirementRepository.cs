namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceRequirementRepository
{
    Task<IReadOnlyList<AuditEvidenceRequirementRecord>> ListByFrameworkIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default);
}
