using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRepository
{
    Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
        Guid tenantId,
        Guid snapshotId,
        byte[] canonicalHopHashSha256,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
        SecurityEvidencePathRecord pathHeader,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        CancellationToken cancellationToken = default);
}
