using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IBrandAssetService
{
    Task<BrandAssetUploadResult> UploadAsync(
        ScopeContext scope,
        BrandAssetUploadRequest request,
        CancellationToken cancellationToken = default);

    Task<BrandAssetReadResult> TryGetAssetAsync(
        ScopeContext scope,
        Guid assetId,
        CancellationToken cancellationToken = default);
}

public sealed class BrandAssetUploadRequest
{
    public BrandAssetType AssetType
    {
        get;
        init;
    }

    public string OriginalFileName
    {
        get;
        init;
    } = string.Empty;

    public byte[] AssetBytes
    {
        get;
        init;
    } = [];

    public string? CreatedBy
    {
        get;
        init;
    }
}

public sealed class BrandAssetUploadResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public BrandAssetRecord? Asset
    {
        get;
        init;
    }
}

public sealed class BrandAssetReadResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public BrandAssetRecord? Asset
    {
        get;
        init;
    }

    public byte[]? AssetBytes
    {
        get;
        init;
    }
}
