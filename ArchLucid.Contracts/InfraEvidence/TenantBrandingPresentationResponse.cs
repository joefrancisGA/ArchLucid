namespace ArchLucid.Contracts.InfraEvidence;

/// <summary>Tenant branding resolved for a single UI surface (masthead, cover, favicon, etc.).</summary>
public sealed class TenantBrandingPresentationResponse
{
    public string Context
    {
        get;
        set;
    } = string.Empty;

    public string MastheadDisplayName
    {
        get;
        set;
    } = string.Empty;

    public bool UsesTenantVisualBrand
    {
        get;
        set;
    }

    public bool ShowPoweredByArchLucid
    {
        get;
        set;
    }

    public bool ShowArchLucidMarkInMasthead
    {
        get;
        set;
    }

    public bool IsProductBrand
    {
        get;
        set;
    }

    public TenantBrandColorsResponse Colors
    {
        get;
        set;
    } = new();

    public Guid? LogoAssetId
    {
        get;
        set;
    }

    public string? LogoHttpsUrl
    {
        get;
        set;
    }

    public string? LogoContentPath
    {
        get;
        set;
    }
}

public sealed class TenantBrandColorsResponse
{
    public string? Primary
    {
        get;
        set;
    }

    public string? Secondary
    {
        get;
        set;
    }

    public string? Accent
    {
        get;
        set;
    }

    public string? Background
    {
        get;
        set;
    }

    public string? Foreground
    {
        get;
        set;
    }
}
