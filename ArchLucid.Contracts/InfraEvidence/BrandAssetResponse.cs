namespace ArchLucid.Contracts.InfraEvidence;

public sealed class BrandAssetResponse
{
    public Guid AssetId
    {
        get;
        set;
    }

    public string AssetType
    {
        get;
        set;
    } = string.Empty;

    public string OriginalFileName
    {
        get;
        set;
    } = string.Empty;

    public string MimeType
    {
        get;
        set;
    } = string.Empty;

    public int? Width
    {
        get;
        set;
    }

    public int? Height
    {
        get;
        set;
    }

    public string ChecksumSha256Hex
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
