using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Effective branding after Active → tenant default → legacy → product resolution.</summary>
public sealed class ResolvedTenantBrandingProfile
{
    public Guid TenantId
    {
        get;
        init;
    }

    public bool IsProductBrand
    {
        get;
        init;
    }

    public string CompanyDisplayName
    {
        get;
        init;
    } = string.Empty;

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

    public string? LegacyLogoHttpsUrl
    {
        get;
        init;
    }

    public BrandingProfileStatus? SourceProfileStatus
    {
        get;
        init;
    }
}
