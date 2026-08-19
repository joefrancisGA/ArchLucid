namespace ArchLucid.Application.Notifications.Email.Models;

/// <summary>Razor template model for finding remediation assignment email (TB-2195).</summary>
public sealed class FindingRemediationAssignmentEmailModel
{
    public string ProductName
    {
        get;
        init;
    } = "ArchLucid";

    public string FindingTitle
    {
        get;
        init;
    } = string.Empty;

    public string FindingInspectUrl
    {
        get;
        init;
    } = string.Empty;

    public string AssignedToQueueUrl
    {
        get;
        init;
    } = string.Empty;

    public string? RemediationDueLabel
    {
        get;
        init;
    }

    public string? LogoImageUrl
    {
        get;
        init;
    }
}
