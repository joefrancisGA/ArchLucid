namespace ArchLucid.Application.Governance;

/// <summary>Rendered TB-2193 waiver expiry reminder body, independent of the email transport.</summary>
public sealed class WaiverExpiryReminderEmailContent
{
    public required string Subject
    {
        get;
        init;
    }

    public required string HtmlBody
    {
        get;
        init;
    }

    public required string TextBody
    {
        get;
        init;
    }
}
