namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRoutingRepository
{
    Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task ReplaceRoutingForPathAsync(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default);
}
