namespace ArchLucid.Application.Notifications.Email.Models;

/// <summary>Razor template model for recurrence completion email (TB-261).</summary>
public sealed class RecurrenceCompletionEmailModel
{
    public string ProductName
    {
        get;
        init;
    } = "ArchLucid";

    public string ScheduleName
    {
        get;
        init;
    } = string.Empty;

    public int NewFindingCount
    {
        get;
        init;
    }

    public int ResolvedFindingCount
    {
        get;
        init;
    }

    public string RunDetailUrl
    {
        get;
        init;
    } = string.Empty;

    public string CompareUrl
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
