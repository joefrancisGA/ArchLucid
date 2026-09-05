using System.Collections.Concurrent;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class InMemoryBrandAssetRepository : IBrandAssetRepository
{
    private readonly ConcurrentDictionary<Guid, BrandAssetRecord> _records = new();

    public Task InsertAsync(BrandAssetRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        _records[record.AssetId] = record;
        return Task.CompletedTask;
    }

    public Task<BrandAssetRecord?> TryGetByIdAsync(Guid tenantId, Guid assetId, CancellationToken cancellationToken = default)
    {
        if (!_records.TryGetValue(assetId, out BrandAssetRecord? record))
            return Task.FromResult<BrandAssetRecord?>(null);

        if (record.TenantId != tenantId)
            return Task.FromResult<BrandAssetRecord?>(null);

        return Task.FromResult<BrandAssetRecord?>(record);
    }

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid assetId,
        BrandAssetStatus status,
        DateTime updatedUtc,
        CancellationToken cancellationToken = default)
    {
        if (!_records.TryGetValue(assetId, out BrandAssetRecord? record) || record.TenantId != tenantId)
            return Task.CompletedTask;

        BrandAssetRecord updated = new()
        {
            AssetId = record.AssetId,
            TenantId = record.TenantId,
            AssetType = record.AssetType,
            OriginalFileName = record.OriginalFileName,
            MimeType = record.MimeType,
            Width = record.Width,
            Height = record.Height,
            StorageReference = record.StorageReference,
            ChecksumSha256 = record.ChecksumSha256,
            Status = status,
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = updatedUtc,
            CreatedBy = record.CreatedBy,
        };

        _records[assetId] = updated;
        return Task.CompletedTask;
    }
}
