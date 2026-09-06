namespace ArchLucid.Persistence.InfraEvidence;

public sealed class TenantBrandingLogo
{
    public bool IsProductBrand
    {
        get;
        init;
    }

    public Guid? AssetId
    {
        get;
        init;
    }

    public string? MimeType
    {
        get;
        init;
    }

    public byte[]? AssetBytes
    {
        get;
        init;
    }

    public string? HttpsUrl
    {
        get;
        init;
    }
}
