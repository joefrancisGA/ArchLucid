using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IBrandAssetRepository
{
    Task InsertAsync(BrandAssetRecord record, CancellationToken cancellationToken = default);

    Task<BrandAssetRecord?> TryGetByIdAsync(Guid tenantId, Guid assetId, CancellationToken cancellationToken = default);

    Task UpdateStatusAsync(
        Guid tenantId,
        Guid assetId,
        BrandAssetStatus status,
        DateTime updatedUtc,
        CancellationToken cancellationToken = default);
}
