using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class BrandAssetService(
    IBrandAssetRepository assetRepository,
    ITenantBrandAssetBlobStore blobStore) : IBrandAssetService
{
    public async Task<BrandAssetUploadResult> UploadAsync(
        ScopeContext scope,
        BrandAssetUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        BrandAssetValidationResult validation = BrandAssetUploadValidator.Validate(request.AssetBytes, request.OriginalFileName);

        if (!validation.Succeeded)
        {
            return new BrandAssetUploadResult
            {
                Succeeded = false,
                ErrorMessage = validation.ErrorMessage,
            };
        }

        Guid assetId = Guid.NewGuid();
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        byte[] checksum = BrandAssetChecksumHasher.ComputeSha256(request.AssetBytes);

        string storageReference = await blobStore.WriteAsync(
            assetId,
            validation.FileExtension,
            validation.MimeType,
            request.AssetBytes,
            cancellationToken);

        BrandAssetRecord record = new()
        {
            AssetId = assetId,
            TenantId = scope.TenantId,
            AssetType = request.AssetType,
            OriginalFileName = request.OriginalFileName,
            MimeType = validation.MimeType,
            StorageReference = storageReference,
            ChecksumSha256 = checksum,
            Status = BrandAssetStatus.Staged,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            CreatedBy = request.CreatedBy,
        };

        await assetRepository.InsertAsync(record, cancellationToken);

        return new BrandAssetUploadResult
        {
            Succeeded = true,
            Asset = record,
        };
    }

    public async Task<BrandAssetReadResult> TryGetAssetAsync(
        ScopeContext scope,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        BrandAssetRecord? record = await assetRepository.TryGetByIdAsync(scope.TenantId, assetId, cancellationToken);

        if (record is null)
        {
            return new BrandAssetReadResult
            {
                Succeeded = false,
                ErrorMessage = "Brand asset was not found in the current tenant scope.",
            };
        }

        byte[]? bytes = await blobStore.TryReadAsync(record.StorageReference, cancellationToken);

        if (bytes is null || bytes.Length == 0)
        {
            return new BrandAssetReadResult
            {
                Succeeded = false,
                ErrorMessage = "Brand asset bytes were not found.",
            };
        }

        return new BrandAssetReadResult
        {
            Succeeded = true,
            Asset = record,
            AssetBytes = bytes,
        };
    }
}
