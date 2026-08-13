namespace ArchLucid.Application.Notifications.Email.Models;

/// <summary>Razor model for <c>Templates/WeeklySponsorSummary.cshtml</c>.</summary>
public sealed class WeeklySponsorSummaryEmailModel
{
    public string ProductName
    {
        get;
        init;
    } = "ArchLucid";

    public string WeekLabel
    {
        get;
        init;
    } = string.Empty;

    public string RunIdHex
    {
        get;
        init;
    } = string.Empty;

    public string RunDetailUrl
    {
        get;
        init;
    } = string.Empty;

    public string SummaryMarkdown
    {
        get;
        init;
    } = string.Empty;

    public string? LogoImageUrl
    {
        get;
        init;
    }
}
