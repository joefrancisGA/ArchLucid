using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Resolved visual/text branding for a specific display surface.</summary>
public sealed class TenantBrandingSurfacePresentation
{
    public BrandingDisplayContext Context
    {
        get;
        init;
    }

    public string MastheadDisplayName
    {
        get;
        init;
    } = string.Empty;

    public bool UsesTenantVisualBrand
    {
        get;
        init;
    }

    public bool ShowPoweredByArchLucid
    {
        get;
        init;
    }

    public bool ShowArchLucidMarkInMasthead
    {
        get;
        init;
    }

    public TenantBrandingLogo Logo
    {
        get;
        init;
    } = new();
}
