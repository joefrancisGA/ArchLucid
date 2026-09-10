using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathRepository : ISecurityEvidencePathRepository
{
    public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<SecurityEvidencePathRecord?>(null);

    public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
        Guid tenantId,
        Guid snapshotId,
        byte[] canonicalHopHashSha256,
        CancellationToken cancellationToken = default)
        => Task.FromResult<SecurityEvidencePathRecord?>(null);

    public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>([]);

    public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
        SecurityEvidencePathRecord pathHeader,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        CancellationToken cancellationToken = default)
        => Task.FromResult(new SecurityEvidencePathInsertResult
        {
            PathId = pathHeader.PathId,
            Created = false,
        });
}
