using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class TenantBrandingProfileRecord
{
    public Guid BrandingProfileId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string? CompanyDisplayName
    {
        get;
        init;
    }

    public string? CompanyLegalName
    {
        get;
        init;
    }

    public string? ShortDisplayName
    {
        get;
        init;
    }

    public Guid? LogoPrimaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSecondaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSquareAssetId
    {
        get;
        init;
    }

    public Guid? LogoFaviconAssetId
    {
        get;
        init;
    }

    public Guid? LogoDarkAssetId
    {
        get;
        init;
    }

    public Guid? LogoLightAssetId
    {
        get;
        init;
    }

    public Guid? LogoReportCoverAssetId
    {
        get;
        init;
    }

    public Guid? LogoMonoAssetId
    {
        get;
        init;
    }

    public string? PrimaryColor
    {
        get;
        init;
    }

    public string? SecondaryColor
    {
        get;
        init;
    }

    public string? AccentColor
    {
        get;
        init;
    }

    public string? BackgroundColor
    {
        get;
        init;
    }

    public string? ForegroundColor
    {
        get;
        init;
    }

    public string? TypographyJson
    {
        get;
        init;
    }

    public string? Tagline
    {
        get;
        init;
    }

    public string? WebsiteUrl
    {
        get;
        init;
    }

    public string? SupportUrl
    {
        get;
        init;
    }

    public BrandingProfileStatus BrandingStatus
    {
        get;
        init;
    }

    public int Version
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

    public string? UpdatedBy
    {
        get;
        init;
    }
}
