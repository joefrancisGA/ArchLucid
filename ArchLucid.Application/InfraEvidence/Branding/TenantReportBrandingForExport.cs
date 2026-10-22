namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>Sanitized tenant branding for PDF, Word, and Markdown report exports.</summary>
public sealed class TenantReportBrandingForExport
{
    public string? CompanyDisplayName
    {
        get;
        init;
    }

    public string? LogoHttpsUrl
    {
        get;
        init;
    }

    public byte[]? LogoBytes
    {
        get;
        init;
    }

    public string? LogoChecksumSha256Hex
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

    public bool ShowPoweredByArchLucid
    {
        get;
        init;
    }

    public bool UsesTenantVisualBrand
    {
        get;
        init;
    }
}
