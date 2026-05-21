namespace ArchLucid.Application.Notifications.Email.Models;

/// <summary>Razor model for <c>Templates/WeeklyExecutiveSummary.cshtml</c>.</summary>
public sealed class WeeklyExecutiveSummaryEmailModel
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
