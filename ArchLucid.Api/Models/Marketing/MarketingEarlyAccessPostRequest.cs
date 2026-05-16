namespace ArchLucid.Api.Models.Marketing;

/// <summary>Anonymous early-access / waitlist body (hero CTA — not tenant registration).</summary>
public sealed class MarketingEarlyAccessPostRequest
{
    public string Email
    {
        get;
        set;
    } = string.Empty;

    public string? CompanyName
    {
        get;
        set;
    }

    public string? Role
    {
        get;
        set;
    }

    /// <summary>Honeypot — must stay empty for legitimate submissions.</summary>
    public string? WebsiteUrl
    {
        get;
        set;
    }

    public string? UtmSource
    {
        get;
        set;
    }

    public string? UtmMedium
    {
        get;
        set;
    }

    public string? UtmCampaign
    {
        get;
        set;
    }
}
