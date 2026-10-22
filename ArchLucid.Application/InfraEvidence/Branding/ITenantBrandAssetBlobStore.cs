namespace ArchLucid.Application.InfraEvidence.Branding;

public interface ITenantBrandAssetBlobStore
{
    Task<string> WriteAsync(Guid assetId, string fileExtension, string mimeType, byte[] assetBytes, CancellationToken cancellationToken);

    Task<byte[]?> TryReadAsync(string storageReference, CancellationToken cancellationToken);
}
