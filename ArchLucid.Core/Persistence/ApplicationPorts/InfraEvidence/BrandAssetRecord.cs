using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class BrandAssetRecord
{
    public Guid AssetId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

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

    public string MimeType
    {
        get;
        init;
    } = string.Empty;

    public int? Width
    {
        get;
        init;
    }

    public int? Height
    {
        get;
        init;
    }

    public string StorageReference
    {
        get;
        init;
    } = string.Empty;

    public byte[] ChecksumSha256
    {
        get;
        init;
    } = [];

    public BrandAssetStatus Status
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }

    public string? CreatedBy
    {
        get;
        init;
    }
}
